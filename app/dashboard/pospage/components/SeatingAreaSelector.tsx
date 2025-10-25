// File: app/dashboard/pospage/components/SeatingAreaSelector.tsx
"use client";

import { useState, useEffect } from 'react';
import { Select, Loader, ComboboxItem, Group, Text, Badge } from '@mantine/core';
import { ApiResponse, SeatingAreaWithVisitInfo } from '@/lib/types'; // Adjust path if needed
import { notifications } from '@mantine/notifications';
import { Armchair } from 'lucide-react'; // Icon

type SeatingAreaSelectorProps = {
    selectedAreaId: number | null;
    onSelect: (area: SeatingAreaWithVisitInfo | null) => void;
    disabled?: boolean;
};

// Type for the items in the Select dropdown
type SelectItem = ComboboxItem & { area: SeatingAreaWithVisitInfo };

export function SeatingAreaSelector({ selectedAreaId, onSelect, disabled }: SeatingAreaSelectorProps) {
    const [areas, setAreas] = useState<SeatingAreaWithVisitInfo[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch active seating areas
    useEffect(() => {
        const fetchAreas = async () => {
            setLoading(true);
            try {
                // Fetch only active areas with visit info for the selector
                const response = await fetch('/api/seating-areas'); // Default fetches active=true
                if (!response.ok) throw new Error('Falha ao buscar mesas/áreas');
                const result: ApiResponse<SeatingAreaWithVisitInfo[]> = await response.json();
                if (result.success && result.data) {
                    setAreas(result.data);
                } else {
                    throw new Error(result.error || 'Não foi possível carregar mesas/áreas');
                }
            } catch (error: any) {
                console.error(error);
                notifications.show({
                    title: 'Erro ao carregar áreas',
                    message: error.message,
                    color: 'red',
                });
            } finally {
                setLoading(false);
            }
        };
        fetchAreas();
    }, []); // Fetch only once on mount

    // Prepare data for the Select component
    const selectData: SelectItem[] = areas.map((area) => ({
        value: area.id.toString(),
        label: area.name, // The text displayed in the input after selection
        area: area, // Store the full area object
    }));

    // Handle selection change
    const handleChange = (value: string | null) => {
        if (!value) {
            onSelect(null);
            return;
        }
        const selected = selectData.find((item) => item.value === value)?.area;
        onSelect(selected || null);
    };

    // Custom rendering for dropdown options
    const renderSelectOption = ({ option }: { option: SelectItem }) => {
        const isOccupied = option.area.visits && option.area.visits.length > 0;
        const clientName = isOccupied ? (option.area.visits[0]?.client?.name || `Cliente #${option.area.visits[0]?.clientId || '?'}`) : null;

        return (
            <Group justify="space-between" wrap="nowrap">
                <Text>{option.label}</Text>
                {isOccupied ? (
                    <Badge color="red" size="sm" variant="light" >
                        Ocupada ({clientName})
                    </Badge>
                 ) : (
                    <Badge color="green" size="sm" variant="light">
                        Livre
                    </Badge>
                 )}
            </Group>
        );
    };

    return (
        <Select
            label="Mesa / Área"
            placeholder={loading ? 'Carregando áreas...' : 'Selecione uma área'}
            data={selectData}
            value={selectedAreaId?.toString() || null}
            onChange={handleChange}
            searchable
            clearable
            disabled={loading || disabled}
            nothingFoundMessage="Nenhuma área encontrada"
            renderOption={renderSelectOption} // Use custom renderer
            leftSection={loading ? <Loader size="xs" /> : <Armchair size={16} />}
        />
    );
}