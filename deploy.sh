#!/bin/bash

# Sair imediatamente se um comando falhar
set -e

# Configurações
IMAGE_NAME="bartolomeusilva/123bit-app"

echo "🚀 Iniciando deploy do 123bit-app (latest)..."

# 1. Build da imagem Docker (usando a plataforma linux/amd64 para compatibilidade com a maioria dos servidores)
echo "🏗️  Construindo imagem Docker (latest)..."
docker build --platform linux/amd64 -t $IMAGE_NAME:latest .

# 2. Push para o Docker Hub
echo "📤 Subindo imagem para o Docker Hub..."
docker push $IMAGE_NAME:latest

echo "✅ Deploy concluído com sucesso!"
echo "🔗 Imagem: https://hub.docker.com/r/$IMAGE_NAME"
echo ""
echo "💡 Dica: No Portainer, vá no seu Stack e clique em 'Update the stack' (com a opção 'Re-pull image' marcada)."
echo "   Isso forçará o Swarm a baixar a nova versão e reiniciar o container com as novas variáveis de ambiente."
