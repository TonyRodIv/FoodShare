-- CreateTable
CREATE TABLE "NotificacaoLida" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificacaoLida_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificacaoLida_usuarioId_idx" ON "NotificacaoLida"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificacaoLida_usuarioId_solicitacaoId_key" ON "NotificacaoLida"("usuarioId", "solicitacaoId");

-- AddForeignKey
ALTER TABLE "NotificacaoLida" ADD CONSTRAINT "NotificacaoLida_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
