export type HelpStep = {
   id: string;
   title: string;
   description: string;
   route: string;
   selector?: string;
   placement?: "top" | "bottom" | "center";
   nextLabel?: string;
};

export const FULL_TOUR_STEPS: HelpStep[] = [
   {
      id: "welcome",
      title: "Bem-vindo ao ControlFin",
      description:
         "Vamos fazer um breve tour pelas principais áreas do sistema: Mesas, Receitas, Despesas, Cartões e Dashboard.",
      route: "*",
      placement: "center",
      nextLabel: "Iniciar tutorial",
   },
   {
      id: "mesas-header",
      title: "Tela de Mesas",
      description:
         "As Mesas funcionam como ambientes de controle independentes, como por exemplo: Pessoal, Família ou Negócio. Cada mesa possui seus próprios dados e membros.",
      route: "/dashboard/mesas",
      selector: '[data-help-id="mesas-header"]',
      placement: "bottom",
   },
   {
      id: "mesas-create",
      title: "Crie sua primeira mesa",
      description:
         "Toda organização começa com uma Mesa. Ela define o contexto onde suas movimentações financeiras serão registradas e analisadas. Crie uma nova mesa e selecione-a como ativa para começar a acompanhar seus dados.",
      route: "/dashboard/mesas",
      selector: '[data-help-id="mesas-new-button"]',
      placement: "bottom",
   },
   {
      id: "receitas-header",
      title: "Controle de Receitas",
      description:
         "Nesta área você registra todas as entradas financeiras, como salários, vendas, recebimentos ou qualquer outro tipo de ganho.",
      route: "/dashboard/receitas",
      selector: '[data-help-id="receitas-header"]',
      placement: "bottom",
   },
   {
      id: "receitas-create",
      title: "Nova Receita",
      description:
         "Utilize este botão para registrar novas receitas. Você pode cadastrar entradas simples, recorrentes ou parceladas.",
      route: "/dashboard/receitas",
      selector: '[data-help-id="receitas-new-button"]',
      placement: "bottom",
   },
   {
      id: "despesas-header",
      title: "Controle de Despesas",
      description:
         "Aqui você acompanha contas, vencimentos e pagamentos. Compras realizadas no cartão de crédito são automaticamente organizadas na fatura correspondente.",
      route: "/dashboard/despesas",
      selector: '[data-help-id="despesas-header"]',
      placement: "bottom",
   },
   {
      id: "despesas-create",
      title: "Nova Despesa",
      description:
         "Registre suas despesas e acompanhe o status de pagamento. Caso selecione cartão de crédito, o lançamento será automaticamente enviado para a fatura.",
      route: "/dashboard/despesas",
      selector: '[data-help-id="despesas-new-button"]',
      placement: "bottom",
   },
   {
      id: "cartoes-header",
      title: "Cartões e Faturas",
      description:
         "Nesta tela você cadastra cartões, acompanha limites e acessa o menu de Fatura/Transações para visualizar os lançamentos organizados por mês.",
      route: "/dashboard/cartoes",
      selector: '[data-help-id="cartoes-header"]',
      placement: "bottom",
   },
   {
      id: "cartoes-create",
      title: "Novo Cartão",
      description:
         "Cadastre cartões de crédito ou débito. As compras no crédito são automaticamente agrupadas na fatura mensal do cartão.",
      route: "/dashboard/cartoes",
      selector: '[data-help-id="cartoes-new-button"]',
      placement: "bottom",
   },
   {
      id: "dashboard-header",
      title: "Visão geral",
      description:
         "No Dashboard você acompanha um resumo financeiro da mesa ativa, com alertas, indicadores e evolução das movimentações.",
      route: "/dashboard",
      selector: '[data-help-id="dashboard-header"]',
      placement: "bottom",
   },
   {
      id: "finish",
      title: "Tutorial finalizado",
      description:
         "Pronto! Sempre que quiser, você pode acessar as dicas específicas de cada tela ou reiniciar o tutorial completo.",
      route: "/dashboard",
      placement: "center",
      nextLabel: "Concluir",
   },
];

const SCREEN_HELP_STEPS: Record<string, HelpStep[]> = {
   "/dashboard": [
      {
         id: "dashboard-intro",
         title: "Ajuda do Dashboard",
         description:
            "O Dashboard apresenta um resumo financeiro da mesa ativa, com alertas, gráficos e atalhos para as principais áreas do sistema.",
         route: "/dashboard",
         placement: "center",
      },
      {
         id: "dashboard-header",
         title: "Resumo da tela",
         description:
            "Aqui você acompanha o consolidado do período atual e acessa rapidamente receitas, despesas e outras áreas do sistema.",
         route: "/dashboard",
         selector: '[data-help-id="dashboard-header"]',
         placement: "bottom",
         nextLabel: "Finalizar",
      },
   ],

   "/dashboard/mesas": [
      {
         id: "mesas-intro",
         title: "Ajuda da tela de Mesas",
         description:
            "As Mesas permitem separar o controle financeiro por diferentes contextos, como casa, negócio ou projetos, facilitando a organização e análise dos dados.",
         route: "/dashboard/mesas",
         placement: "center",
      },
      {
         id: "mesas-header",
         title: "Gerenciamento de Mesas",
         description:
            "Nesta área você pode criar, editar e selecionar a mesa ativa. Todas as movimentações registradas no sistema respeitam a mesa atualmente selecionada.",
         route: "/dashboard/mesas",
         selector: '[data-help-id="mesas-header"]',
         placement: "bottom",
      },
      {
         id: "mesas-new",
         title: "Nova Mesa",
         description:
            "Use este botão para criar um novo ambiente de controle financeiro e manter cada contexto organizado separadamente.",
         route: "/dashboard/mesas",
         selector: '[data-help-id="mesas-new-button"]',
         placement: "bottom",
         nextLabel: "Finalizar",
      },
   ],

   "/dashboard/receitas": [
      {
         id: "receitas-intro",
         title: "Ajuda da tela de Receitas",
         description:
            "Registre entradas financeiras, confirme recebimentos e acompanhe a previsão de caixa da mesa ativa.",
         route: "/dashboard/receitas",
         placement: "center",
      },
      {
         id: "receitas-new",
         title: "Nova Receita",
         description:
            "Clique aqui para abrir o formulário e registrar uma nova entrada financeira.",
         route: "/dashboard/receitas",
         selector: '[data-help-id="receitas-new-button"]',
         placement: "bottom",
         nextLabel: "Finalizar",
      },
   ],

   "/dashboard/despesas": [
      {
         id: "despesas-intro",
         title: "Ajuda da tela de Despesas",
         description:
            "Controle contas a pagar, acompanhe vencimentos e registre pagamentos. Compras realizadas no crédito são organizadas automaticamente em faturas.",
         route: "/dashboard/despesas",
         placement: "center",
      },
      {
         id: "despesas-new",
         title: "Nova Despesa",
         description:
            "Clique aqui para registrar uma nova despesa na mesa ativa.",
         route: "/dashboard/despesas",
         selector: '[data-help-id="despesas-new-button"]',
         placement: "bottom",
         nextLabel: "Finalizar",
      },
   ],

   "/dashboard/cartoes": [
      {
         id: "cartoes-intro",
         title: "Ajuda da tela de Cartões",
         description:
            "Cadastre cartões de crédito e débito. O sistema organiza automaticamente as compras no crédito dentro da fatura mensal.",
         route: "/dashboard/cartoes",
         placement: "center",
      },
      {
         id: "cartoes-header",
         title: "Acompanhamento de cartões",
         description:
            "No menu de cada cartão você pode acessar a fatura ou visualizar as transações do período, acompanhando valores e status.",
         route: "/dashboard/cartoes",
         selector: '[data-help-id="cartoes-header"]',
         placement: "bottom",
      },
      {
         id: "cartoes-new",
         title: "Novo Cartão",
         description:
            "Use este botão para cadastrar um novo cartão. Compras no crédito serão automaticamente agrupadas na fatura correspondente.",
         route: "/dashboard/cartoes",
         selector: '[data-help-id="cartoes-new-button"]',
         placement: "bottom",
         nextLabel: "Finalizar",
      },
   ],

   "/dashboard/categorias": [
      {
         id: "categorias-intro",
         title: "Ajuda da tela de Categorias",
         description:
            "Crie categorias para organizar melhor suas receitas e despesas, facilitando a análise financeira.",
         route: "/dashboard/categorias",
         placement: "center",
      },
      {
         id: "categorias-new",
         title: "Nova Categoria",
         description: "Clique aqui para cadastrar uma nova categoria.",
         route: "/dashboard/categorias",
         selector: '[data-help-id="categorias-new-button"]',
         placement: "bottom",
         nextLabel: "Finalizar",
      },
   ],

   "/dashboard/conta": [
      {
         id: "conta-intro",
         title: "Ajuda da Minha Conta",
         description:
            "Nesta área você pode atualizar seu perfil, configurar segurança, ajustar preferências e entrar em contato com o suporte.",
         route: "/dashboard/conta",
         placement: "center",
      },
      {
         id: "conta-header",
         title: "Configurações da conta",
         description:
            "Utilize esta seção para gerenciar suas informações pessoais e preferências do sistema.",
         route: "/dashboard/conta",
         selector: '[data-help-id="conta-header"]',
         placement: "bottom",
         nextLabel: "Finalizar",
      },
   ],
};

export function getScreenHelpSteps(pathname: string): HelpStep[] {
   return (
      SCREEN_HELP_STEPS[pathname] ?? [
         {
            id: "default-help",
            title: "Ajuda desta tela",
            description:
               "Use esta area para trabalhar os dados da mesa ativa e acompanhar seus resultados.",
            route: pathname,
            placement: "center",
            nextLabel: "Finalizar",
         },
      ]
   );
}
