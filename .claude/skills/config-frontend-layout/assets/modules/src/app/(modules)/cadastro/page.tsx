import { ModuleMenuPage } from '@/components/module-menu-page';

export default function CadastroDashboardPage() {
  return (
    <ModuleMenuPage
      title="Dashboard de Cadastro — em construção"
      description="Ponto de entrada do módulo de Cadastro."
      summary="Este módulo ainda não tem conteúdo. Use o menu lateral para navegar e implemente as telas conforme a necessidade do seu domínio."
      highlights={[
        {
          title: 'Próximo passo',
          description: 'Crie as telas e ações deste módulo a partir deste dashboard inicial.',
        },
      ]}
    />
  );
}
