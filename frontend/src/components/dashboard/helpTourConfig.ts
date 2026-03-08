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
         "Vamos fazer um tour pratico pelas etapas principais: Mesas, Receitas, Despesas, Cartoes e Dashboard.",
      route: "*",
      placement: "center",
      nextLabel: "Iniciar tutorial",
   },
   {
      id: "mesas-header",
      title: "Tela de Mesas",
      description:
         "Mesa e um ambiente de controle separado (ex: Pessoal, Familia ou Negocio). Cada mesa tem seus proprios dados e membros.",
      route: "/dashboard/mesas",
      selector: '[data-help-id="mesas-header"]',
      placement: "bottom",
   },
   {
      id: "mesas-create",
      title: "Crie sua primeira mesa",
      description:
         "Clique em Nova Mesa para criar um novo contexto. Depois selecione a mesa ativa para acompanhar separado ou no consolidado.",
      route: "/dashboard/mesas",
      selector: '[data-help-id="mesas-new-button"]',
      placement: "bottom",
   },
   {
      id: "receitas-header",
      title: "Controle de Receitas",
      description:
         "Agora vamos para receitas. Aqui entram seus recebimentos, ganhos e entradas.",
      route: "/dashboard/receitas",
      selector: '[data-help-id="receitas-header"]',
      placement: "bottom",
   },
   {
      id: "receitas-create",
      title: "Nova receita",
      description:
         "Use esse botao para registrar receitas simples, recorrentes ou parceladas.",
      route: "/dashboard/receitas",
      selector: '[data-help-id="receitas-new-button"]',
      placement: "bottom",
   },
   {
      id: "despesas-header",
      title: "Controle de Despesas",
      description:
         "Aqui voce controla contas, vencimentos e pagamentos. Compras no credito entram na fatura e aparecem agrupadas.",
      route: "/dashboard/despesas",
      selector: '[data-help-id="despesas-header"]',
      placement: "bottom",
   },
   {
      id: "despesas-create",
      title: "Nova despesa",
      description:
         "Registre despesas e marque pagamentos. Se escolher cartao de credito, o lancamento vai para a fatura automaticamente.",
      route: "/dashboard/despesas",
      selector: '[data-help-id="despesas-new-button"]',
      placement: "bottom",
   },
   {
      id: "cartoes-header",
      title: "Cartoes e fatura",
      description:
         "Nesta tela voce cadastra cartoes, acompanha limite e abre o menu Fatura/Transacoes para ver os detalhes por mes.",
      route: "/dashboard/cartoes",
      selector: '[data-help-id="cartoes-header"]',
      placement: "bottom",
   },
   {
      id: "cartoes-create",
      title: "Novo cartao",
      description:
         "Crie cartoes de credito e debito. O credito fica agrupado em fatura e pode ser acompanhado no menu de cada cartao.",
      route: "/dashboard/cartoes",
      selector: '[data-help-id="cartoes-new-button"]',
      placement: "bottom",
   },
   {
      id: "dashboard-header",
      title: "Visao geral",
      description:
         "No Dashboard voce enxerga resumo, alertas e evolucao da mesa ativa, com visao consolidada quando precisar comparar contextos.",
      route: "/dashboard",
      selector: '[data-help-id="dashboard-header"]',
      placement: "bottom",
   },
   {
      id: "finish",
      title: "Tutorial finalizado",
      description:
         "Pronto. Sempre que quiser, abra as dicas da tela atual ou reinicie o tutorial completo.",
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
            "Resumo financeiro da mesa ativa com alertas, graficos e atalho para receitas e despesas.",
         route: "/dashboard",
         placement: "center",
      },
      {
         id: "dashboard-header",
         title: "Resumo da tela",
         description:
            "Aqui voce acompanha o consolidado do mes e acessa as principais areas.",
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
            "Use mesas para separar controles por contexto (casa, negocio, projetos). Assim voce acompanha junto e separado com clareza.",
         route: "/dashboard/mesas",
         placement: "center",
      },
      {
         id: "mesas-header",
         title: "O que fazer aqui",
         description:
            "Crie, edite e selecione a mesa ativa. Tudo que voce lancar em receitas, despesas e cartoes respeita a mesa selecionada.",
         route: "/dashboard/mesas",
         selector: '[data-help-id="mesas-header"]',
         placement: "bottom",
      },
      {
         id: "mesas-new",
         title: "Nova Mesa",
         description:
            "Use esse botao para criar novos ambientes e manter cada controle financeiro no seu proprio espaco.",
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
            "Registre entradas, confirme recebimentos e acompanhe previsao de caixa.",
         route: "/dashboard/receitas",
         placement: "center",
      },
      {
         id: "receitas-new",
         title: "Nova Receita",
         description: "Clique para abrir o formulario de nova receita.",
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
            "Controle contas a vencer, pagas e vencidas. Compras no credito aparecem agrupadas em fatura para facilitar o acompanhamento.",
         route: "/dashboard/despesas",
         placement: "center",
      },
      {
         id: "despesas-new",
         title: "Nova Despesa",
         description: "Clique aqui para cadastrar uma nova despesa.",
         route: "/dashboard/despesas",
         selector: '[data-help-id="despesas-new-button"]',
         placement: "bottom",
         nextLabel: "Finalizar",
      },
   ],
   "/dashboard/cartoes": [
      {
         id: "cartoes-intro",
         title: "Ajuda da tela de Cartoes",
         description:
            "Cadastre cartoes de credito e debito. O credito organiza despesas em fatura e o debito mostra transacoes do mes.",
         route: "/dashboard/cartoes",
         placement: "center",
      },
      {
         id: "cartoes-header",
         title: "Como acompanhar",
         description:
            "No menu Fatura/Transacoes de cada cartao voce abre o painel mensal para ver lancamentos, status e valores.",
         route: "/dashboard/cartoes",
         selector: '[data-help-id="cartoes-header"]',
         placement: "bottom",
      },
      {
         id: "cartoes-new",
         title: "Novo Cartao",
         description:
            "Use esse botao para cadastrar um cartao. Em compras no credito, os lancamentos ficam agrupados na fatura.",
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
            "Crie categorias para organizar melhor receitas e despesas.",
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
            "Aqui voce atualiza perfil, seguranca, preferencias e fala com o suporte.",
         route: "/dashboard/conta",
         placement: "center",
      },
      {
         id: "conta-header",
         title: "Configuracoes pessoais",
         description:
            "Use esta area para ajustar dados da conta e preferencias do sistema.",
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
