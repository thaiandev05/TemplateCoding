import { IsOptional } from "class-validator"
import { LogisticsPartNer } from "prisma/generated/prisma"

export class RegisterSellerDto {
    shopName: string
    addressShop: string
    @IsOptional()
    logisticsPartner: LogisticsPartNer
    identification: string
    taxPersonal: string
    email: string
    phoneNumber: string
}