import { IsNotEmpty, IsString } from "class-validator"

export class CreateCategoryDto {

    @IsString()
    @IsNotEmpty({message: 'Name không được bỏ trống'})
    name:string

    @IsString()
    @IsNotEmpty({message: 'Slug không được bỏ trống'})
    slug:string

    @IsString()
    @IsNotEmpty({message: 'Description không được bỏ trống'})
    description:string

}
