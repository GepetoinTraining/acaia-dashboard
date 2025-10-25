import { Text } from "@mantine/core";
import { PageHeader } from "../components/PageHeader";

export default function HostessesPage() {
  return (
    <>
      <PageHeader title="Hostesses" />
      <Text c="dimmed">
        Aqui você verá a lista de todas as hostesses, seus status e perfis.
      </Text>
    </>
  );
}
