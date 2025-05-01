import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export type UserDocument = User & Document;

@Schema({
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
})
export class User {
  // Añadimos explícitamente la propiedad _id
  _id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  nombreCompleto: string;

  @Prop({ required: true, unique: true })
  correoElectronico: string;

  @Prop({ required: true })
  contraseña: string;

  @Prop()
  fechaCreacion: Date;

  @Prop()
  fechaActualizacion: Date;

  @Prop({ default: true })
  activo: boolean;

  // Método para comparar contraseñas
  comparePassword: (password: string) => Promise<boolean>;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Middleware para hashear la contraseña antes de guardar
UserSchema.pre('save', async function (next) {
  if (!this.isModified('contraseña')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.contraseña = await bcrypt.hash(this.contraseña, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Add method to schema
UserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.contraseña);
};