export default function TermsPage() {
  return (
    <div className="page-content">
      <div className="terms-container">
        <div className="terms-header">
          <h1>Termos de Uso do 123bit</h1>
          <p className="terms-updated">Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="terms-content">
          <section>
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar a plataforma 123bit, você concorda com estes Termos de Uso. 
              Se você não concorda com qualquer parte destes termos, não utilize nossos serviços.
            </p>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento. 
              Alterações significativas serão comunicadas por email ou através de notificação na plataforma.
            </p>
          </section>

          <section>
            <h2>2. Descrição do Serviço</h2>
            <p>
              O 123bit é uma plataforma de encurtamento de URLs que oferece:
            </p>
            <ul>
              <li>Criação e gerenciamento de links curtos personalizados</li>
              <li>Geração de QR Codes customizáveis</li>
              <li>Analytics e métricas de desempenho</li>
              <li>Gerenciamento de campanhas de marketing</li>
              <li>Bio Pages (páginas estilo "link na bio")</li>
              <li>Integração via API REST</li>
              <li>Monitoramento de saúde de links</li>
              <li>Workspaces para colaboração em equipe</li>
            </ul>
          </section>

          <section>
            <h2>3. Contas e Cadastro</h2>
            <h3>3.1. Elegibilidade</h3>
            <p>
              Você deve ter pelo menos 18 anos de idade para criar uma conta no 123bit.
              Ao criar uma conta, você declara que todas as informações fornecidas são verdadeiras e precisas.
            </p>

            <h3>3.2. Segurança da Conta</h3>
            <p>
              Você é responsável por manter a confidencialidade de suas credenciais de acesso. 
              Todas as atividades que ocorrem em sua conta são de sua responsabilidade. 
              Notifique-nos imediatamente em caso de uso não autorizado.
            </p>

            <h3>3.3. Encerramento</h3>
            <p>
              Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos 
              ou que fiquem inativas por períodos prolongados.
            </p>
          </section>

          <section>
            <h2>4. Planos e Pagamento</h2>
            <h3>4.1. Plano Gratuito (FREE)</h3>
            <p>
              O plano gratuito inclui até 50 links e 1.000 cliques rastreados por mês. 
              Recursos como analytics, QR Codes e 1 domínio personalizado estão incluídos.
            </p>

            <h3>4.2. Planos Pagos</h3>
            <p>
              Os planos PRO e ENTERPRISE oferecem limites maiores e recursos adicionais. 
              Os preços e detalhes de cada plano estão disponíveis na página de upgrade.
            </p>

            <h3>4.3. Política de Reembolso</h3>
            <p>
              Oferecemos reembolso integral nos primeiros 7 dias após a assinatura. 
              Após este período, não há reembolso para o mês corrente.
            </p>

            <h3>4.4. Alteração de Preços</h3>
            <p>
              Nos reservamos o direito de alterar os preços com aviso prévio de 30 dias. 
              Alterações não afetam assinantes atuais até o fim do período contratado.
            </p>
          </section>

          <section>
            <h2>5. Uso Aceitável</h2>
            <h3>5.1. Você Concorda em Não</h3>
            <ul>
              <li>Criar links que direcionem para conteúdo ilegal, malicioso ou enganoso</li>
              <li>Usar a plataforma para distribuir malware, phishing ou spam</li>
              <li>Violar direitos de propriedade intelectual de terceiros</li>
              <li>Contornar limites do plano através de múltiplas contas</li>
              <li>Usar a API de forma abusiva que comprometa a estabilidade do serviço</li>
              <li>Revender o serviço sem autorização prévia</li>
              <li>Coletar dados de outros usuários sem consentimento</li>
            </ul>

            <h3>5.2. Moderação de Conteúdo</h3>
            <p>
              Reservamo-nos o direito de desativar links que violem estes termos 
              ou leis aplicáveis, sem aviso prévio.
            </p>
          </section>

          <section>
            <h2>6. Propriedade Intelectual</h2>
            <p>
              O 123bit e todo seu conteúdo, recursos e funcionalidades são e continuarão sendo 
              de propriedade exclusiva do 123bit e seus licenciadores.
            </p>
            <p>
              Você mantém todos os direitos sobre o conteúdo que cria na plataforma. 
              Ao usar nossos serviços, você nos concede uma licença limitada para hospedar 
              e exibir seu conteúdo estritamente para fornecer o serviço.
            </p>
          </section>

          <section>
            <h2>7. Privacidade e Dados</h2>
            <p>
              Nossa Política de Privacidade descreve como coletamos, usamos e compartilhamos 
              suas informações. Ao usar o 123bit, você concorda com a coleta e uso de dados 
              conforme descrito na política.
            </p>
            <p>
              Coletamos dados de analytics dos seus links para fornecer métricas de desempenho. 
              Esses dados são seus e podem ser exportados a qualquer momento.
            </p>
          </section>

          <section>
            <h2>8. API e Integrações</h2>
            <p>
              A API do 123bit está disponível para todos os usuários. Chaves de API são 
              pessoais e intransferíveis.
            </p>
            <ul>
                <li>Você é responsável por manter suas chaves de API em segurança</li>
                <li>Chaves comprometidas devem ser revogadas imediatamente</li>
                <li>Reservamo-nos o direito de limitar requisições abusivas</li>
              </ul>
          </section>

          <section>
            <h2>9. Disponibilidade do Serviço</h2>
            <p>
              Nos esforçamos para manter o serviço disponível 24/7, mas não garantimos 
              disponibilidade ininterrupta. Manutenções programadas serão comunicadas com antecedência.
            </p>
            <p>
              Não nos responsabilizamos por interrupções causadas por fatores fora do nosso 
              controle, como falhas de provedores de infraestrutura, ataques DDoS ou força maior.
            </p>
          </section>

          <section>
            <h2>10. Limitação de Responsabilidade</h2>
            <p>
              O 123bit é fornecido "como está" e "conforme disponível". Não garantimos que 
              o serviço será ininterrupto, livre de erros ou seguro.
            </p>
            <p>
              Em nenhuma circunstância o 123bit será responsável por danos indiretos, 
              incidentais, especiais, consequenciais ou punitivos, incluindo perda de lucros, 
              dados ou oportunidades.
            </p>
            <p>
              A responsabilidade total do 123bit em qualquer reclamação não excederá o valor 
              pago por você nos últimos 12 meses.
            </p>
          </section>

          <section>
            <h2>11. Links de Terceiros</h2>
            <p>
              O 123bit pode conter links para sites de terceiros. Não endossamos nem nos 
              responsabilizamos pelo conteúdo ou práticas de privacidade desses sites.
            </p>
          </section>

          <section>
            <h2>12. Rescisão</h2>
            <p>
              Você pode encerrar sua conta a qualquer momento através das configurações da conta 
              ou entrando em contato conosco.
            </p>
            <p>
              Podemos suspender ou encerrar sua conta imediatamente, sem aviso prévio, por 
              violação destes termos. Após o encerramento, seus dados serão mantidos por até 
              30 dias antes da exclusão permanente.
            </p>
          </section>

          <section>
            <h2>13. Lei Aplicável</h2>
            <p>
              Estes termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida 
              no foro da comarca de São Paulo, SP.
            </p>
          </section>

          <section>
            <h2>14. Contato</h2>
            <p>
              Para dúvidas sobre estes termos, entre em contato:
            </p>
            <ul>
              <li><strong>Email:</strong> contato@123bit.com</li>
              <li><strong>Endereço:</strong> São Paulo, SP, Brasil</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
