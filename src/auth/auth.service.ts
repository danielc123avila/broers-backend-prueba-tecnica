import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import {
  ResetPasswordDto,
  ConfirmResetPasswordDto,
} from './dto/reset-password.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {
    // Configurar el transporte de correo
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.MAIL_PORT || '587'),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER || '',
        pass: process.env.MAIL_PASSWORD || '',
      },
    });
  }

  async login(loginDto: LoginDto) {
    try {
      // Buscar usuario por correo
      const user = await this.usersService.findByEmail(
        loginDto.correoElectronico,
      );

      // Verificar si el usuario está activo
      if (!user.activo) {
        throw new UnauthorizedException('Usuario inactivo');
      }

      // Validar contraseña
      const isPasswordValid = await user.comparePassword(loginDto.contraseña);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Generar token JWT
      const payload = {
        email: user.correoElectronico,
        sub: user._id.toString(),
      };
      const token = this.jwtService.sign(payload);

      return {
        mensaje: 'Inicio de sesión exitoso',
        token,
        usuario: {
          id: user._id.toString(),
          nombreCompleto: user.nombreCompleto,
          correoElectronico: user.correoElectronico,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(error.message || 'Error de autenticación');
    }
  }

  async refreshToken(userId: string) {
    const user = await this.usersService.findOne(userId);
    const payload = { email: user.correoElectronico, sub: user._id.toString() };
    const token = this.jwtService.sign(payload);

    return {
      mensaje: 'Token renovado exitosamente',
      token,
    };
  }

  async requestPasswordReset(resetPasswordDto: ResetPasswordDto) {
    try {
      // Buscar usuario por correo
      const user = await this.usersService.findByEmail(
        resetPasswordDto.correoElectronico,
      );

      // Generar token de restablecimiento (expira en 1 hora)
      const payload = {
        email: user.correoElectronico,
        sub: user._id.toString(),
        type: 'password-reset',
      };
      const token = this.jwtService.sign(payload, { expiresIn: '1h' });

      // Enviar correo con enlace de restablecimiento
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password?token=${token}`;

      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || 'sbstngerardo@gmail.com',
        to: user.correoElectronico,
        subject: 'Restablecimiento de contraseña - Broers',
        html: `
          <h1>Restablecimiento de contraseña</h1>
          <p>Hola ${user.nombreCompleto},</p>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <p><a href="${resetUrl}">Restablecer contraseña</a></p>
          <p>Este enlace expirará en 1 hora.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
          <p>Saludos,<br>Equipo de Broers</p>
        `,
      });

      return {
        mensaje: 'Correo enviado con enlace de recuperación',
      };
    } catch (error) {
      // No revelamos si el correo existe o no por seguridad
      return {
        mensaje:
          'correo no enviado, si el correo existe se enviará un enlace de recuperación',
      };
    }
  }

  async confirmPasswordReset(confirmResetDto: ConfirmResetPasswordDto) {
    try {
      // Verificar y decodificar el token
      const payload = this.jwtService.verify(confirmResetDto.token);

      // Validar que sea un token de restablecimiento de contraseña
      if (payload.type !== 'password-reset') {
        throw new BadRequestException('Token inválido');
      }

      // Buscar usuario
      const user = await this.usersService.findOne(payload.sub);

      // Actualizar contraseña - Usando el método update del servicio
      // que activará el middleware pre-save para hacer el hash de la contraseña
      await this.usersService.update(user._id.toString(), {
        contraseña: confirmResetDto.nuevaContraseña,
      });

      return {
        mensaje: 'Contraseña actualizada exitosamente',
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('El token ha expirado');
      }
      throw new BadRequestException('Token inválido o expirado');
    }
  }
}
