import { Text } from "@mantine/core";
import { PageHeader } from "../components/PageHeader";

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Relatórios (BI)" />
      <Text c="dimmed">
        Aqui você verá os gráficos e relatórios de BI, como faturamento por
        cliente, hostess mais rentável, etc.
      </Text>
    </>
  );
}
