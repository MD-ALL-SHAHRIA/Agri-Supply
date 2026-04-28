import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file')) 
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('কোনো ফাইল দেওয়া হয়নি!');
    
    const result = await this.uploadService.uploadFile(file);
    
    return {
      message: 'ছবি সফলভাবে আপলোড হয়েছে!',
      url: result.secure_url, 
    };
  }
}