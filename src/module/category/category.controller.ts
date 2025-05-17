import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { Roles } from 'src/decorator/roles.decorator';
import { CreateCategoryDto } from 'src/module/category/dto/create-category.dto';
import { Public } from 'src/decorator/public.decorator';
import { UpdateCategoryDto } from 'src/module/category/dto/update-category.dto';
import { PanigationCategoryDto } from 'src/module/category/dto/panigation-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Roles('admin')
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string, @Query() query: PanigationCategoryDto) {
    return this.categoryService.findOne(slug, query);
  }
}
