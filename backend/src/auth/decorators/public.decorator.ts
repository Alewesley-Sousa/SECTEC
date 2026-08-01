// src/auth/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => {
  console.log('🔥 Decorator Public() aplicado!');
  return SetMetadata(IS_PUBLIC_KEY, true);
};