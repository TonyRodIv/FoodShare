/*
  Warnings:

  - You are about to drop the column `categoria` on the `Doacao` table. All the data in the column will be lost.
  - You are about to drop the column `nome` on the `Doacao` table. All the data in the column will be lost.
  - You are about to drop the column `quantidade` on the `Doacao` table. All the data in the column will be lost.
  - You are about to drop the column `validade` on the `Doacao` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Doacao" DROP COLUMN "categoria",
DROP COLUMN "nome",
DROP COLUMN "quantidade",
DROP COLUMN "validade";

-- CreateTable
CREATE TABLE "ItemDoacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "validade" TIMESTAMP(3) NOT NULL,
    "doacaoId" TEXT NOT NULL,

    CONSTRAINT "ItemDoacao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ItemDoacao" ADD CONSTRAINT "ItemDoacao_doacaoId_fkey" FOREIGN KEY ("doacaoId") REFERENCES "Doacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
