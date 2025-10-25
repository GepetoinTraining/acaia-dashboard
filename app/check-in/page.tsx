// File: app/check-in/page.tsx
"use client"; // This page handles user interaction (button click)

import { Container, Paper, Title, Text, Button, Stack, LoadingOverlay, TextInput } from "@mantine/core";
import { useState } from "react";
import { useRouter } from "next/navigation"; // Use App Router's navigation
import { notifications } from "@mantine/notifications";
import { ApiResponse } from "@/lib/types"; // Adjust path if needed

export default function CheckInPage() {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkedIn, setCheckedIn] = useState(false); // State to show confirmation
    const [welcomeName, setWelcomeName] = useState<string | null>(null);
    const router = useRouter(); // Use App Router hook

    // --- Configuration (Move to ENV or fetch later) ---
    const entryFee = 50.00; // Hardcoded entry fee for MVP
    // ---

    const handleCheckIn = async () => {
        setLoading(true);
        try {
            const payload = {
                name: name || null, // Send null if empty
                phoneNumber: phoneNumber || null, // Send null if empty
                entryFeePaid: entryFee
            };

            const response = await fetch("/api/check-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result: ApiResponse<{ visitId: number; message: string; clientName: string | null }> = await response.json();

            if (response.ok && result.success && result.data) {
                setWelcomeName(result.data.clientName); // Store the name used/created
                setCheckedIn(true); // Show success message
                notifications.show({
                    title: "Check-in Concluído!",
                    message: result.data.message,
                    color: "green",
                    autoClose: 7000, // Keep message longer
                });
                // No redirect needed, user stays on this page until they scan a table QR
            } else {
                throw new Error(result.error || "Falha ao realizar check-in.");
            }

        } catch (error: any) {
            console.error("Check-in error:", error);
            notifications.show({
                title: "Erro no Check-in",
                message: error.message,
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size="xs" style={{ height: "100vh" }}>
            <Stack justify="center" style={{ height: "100%" }}>
                <Paper withBorder shadow="md" p="xl" radius="md">
                    <LoadingOverlay visible={loading} />
                    <Stack align="center" gap="lg">
                        <Title order={2} ta="center">Bem-vindo(a) à Acaia!</Title>

                        {checkedIn ? (
                            <>
                                <Text size="lg" ta="center" c="green">
                                    Entrada registrada com sucesso{welcomeName ? `, ${welcomeName}` : ''}!
                                </Text>
                                <Text ta="center" c="dimmed">
                                    Por favor, encontre um lugar e escaneie o QR code na sua mesa para acessar o menu e chamar o atendimento.
                                </Text>
                                {/* Maybe add a button to go back to a homepage or just let them close the tab */}
                            </>
                        ) : (
                            <>
                                <Text ta="center">
                                    Taxa de entrada hoje: <Text component="span" fw={700}>R$ {entryFee.toFixed(2)}</Text>
                                    {/* Add info about payment method if needed */}
                                </Text>

                                <Text size="sm" ta="center" c="dimmed">
                                    (Opcional) Identifique-se para uma experiência personalizada:
                                </Text>
                                <TextInput
                                    label="Seu Nome"
                                    placeholder="Como gostaria de ser chamado(a)?"
                                    value={name}
                                    onChange={(event) => setName(event.currentTarget.value)}
                                    disabled={loading}
                                    w="100%"
                                />
                                <TextInput
                                    label="Telefone (WhatsApp)"
                                    placeholder="(XX) XXXXX-XXXX (Opcional)"
                                    value={phoneNumber}
                                    onChange={(event) => setPhoneNumber(event.currentTarget.value)}
                                    disabled={loading}
                                    w="100%"
                                />

                                <Button
                                    fullWidth
                                    mt="md"
                                    color="pastelGreen" // Use theme color
                                    onClick={handleCheckIn}
                                    loading={loading}
                                    size="lg"
                                >
                                    Confirmar Entrada
                                </Button>
                            </>
                        )}
                    </Stack>
                </Paper>
            </Stack>
        </Container>
    );
}