import { PrismaClient } from "@prisma/client"
//acesso a todas as tabelas do banco de dados
export const prisma = new PrismaClient({
  log: ["query"],
})
