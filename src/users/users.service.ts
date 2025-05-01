import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    // Verificar si el correo ya existe
    const existingUser = await this.userModel
      .findOne({ correoElectronico: createUserDto.correoElectronico })
      .exec();
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const newUser = new this.userModel(createUserDto);
    return newUser.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-contraseña').exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    try {
      // Validar que el id tenga un formato válido para MongoDB
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`ID de usuario inválido`);
      }

      const user = await this.userModel
        .findById(id)
        .select('-contraseña')
        .exec();
      if (!user) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Error al buscar usuario: ${error.message}`);
    }
  }

  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({ correoElectronico: email })
      .exec();
    if (!user) {
      throw new NotFoundException(`Usuario con correo ${email} no encontrado`);
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    try {
      // Validar que el id tenga un formato válido para MongoDB
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`ID de usuario inválido`);
      }

      // Si se intenta actualizar el correo, verificar que no exista
      if (updateUserDto.correoElectronico) {
        const existingUser = await this.userModel
          .findOne({
            correoElectronico: updateUserDto.correoElectronico,
            _id: { $ne: new Types.ObjectId(id) },
          })
          .exec();

        if (existingUser) {
          throw new ConflictException(
            'El correo electrónico ya está registrado por otro usuario',
          );
        }
      }

      // Si hay actualización de contraseña, aplicamos el hash manualmente
      // ya que findByIdAndUpdate no activa los middleware pre-save
      if (updateUserDto.contraseña) {
        // Primero buscamos el usuario
        const user = await this.userModel.findById(id).exec();
        if (!user) {
          throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }

        // Aplicamos los cambios al documento
        Object.assign(user, updateUserDto);

        // Guardamos, lo que activará el middleware pre-save para la contraseña
        const savedUser = await user.save();
        return savedUser;
      } else {
        // Si no hay actualización de contraseña, usamos findByIdAndUpdate
        const updatedUser = await this.userModel
          .findByIdAndUpdate(id, updateUserDto, { new: true })
          .select('-contraseña')
          .exec();

        if (!updatedUser) {
          throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }

        return updatedUser;
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new NotFoundException(
        `Error al actualizar usuario: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Validar que el id tenga un formato válido para MongoDB
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`ID de usuario inválido`);
      }

      const result = await this.userModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(
        `Error al eliminar usuario: ${error.message}`,
      );
    }
  }
}
