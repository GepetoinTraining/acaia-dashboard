// File: app/dashboard/pospage/components/SeatingAreaSelector.tsx
"use client";

import { useState, useEffect } from 'react';
import { Select, Loader, ComboboxItem, Group, Text, Badge, ComboboxLikeRenderOptionInput } from '@mantine/core';
import { ApiResponse, SeatingAreaWithVisitInfo } from '@/lib/types';
import { notifications } from '@mantine/notifications';
import { Armchair } from 'lucide-react';
import { Client, Visit, SeatingArea } from '@prisma/client'; // Import base types if needed

// Type for the items in the Select dropdown, extending Mantine's base type
type SelectItem = ComboboxItem & { area: SeatingAreaWithVisitInfo };

type SeatingAreaSelectorProps = {
    selectedAreaId: number | null;
    onSelect: (area: SeatingAreaWithVisitInfo | null) => void;
    disabled?: boolean;
};


export function SeatingAreaSelector({ selectedAreaId, onSelect, disabled }: SeatingAreaSelectorProps) {
    const [areas, setAreas] = useState<SeatingAreaWithVisitInfo[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch active seating areas
    useEffect(() => {
        const fetchAreas = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/seating-areas');
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

    // Prepare data for the Select component, ensuring it includes the 'area' property
    const selectData: SelectItem[] = areas.map((area) => ({
        value: area.id.toString(),
        label: area.name,
        area: area, // Include the full area object
    }));

    // Handle selection change
    const handleChange = (value: string | null) => {
        if (!value) {
            onSelect(null);
            return;
        }
        const selectedItem = selectData.find((item) => item.value === value);
        onSelect(selectedItem?.area || null);
    };

    // --- FIX: Cast item.option to SelectItem inside the function ---
    // Custom rendering for dropdown options
    const renderSelectOption = (item: ComboboxLikeRenderOptionInput<ComboboxItem>) => {
        // Cast the base ComboboxItem to our extended SelectItem type
        const option = item.option as SelectItem;
        // Now we can safely access option.area
        const areaData = option.area;
        const isOccupied = areaData.visits && areaData.visits.length > 0;
        const clientName = isOccupied ? (areaData.visits[0]?.client?.name || `Cliente #${areaData.visits[0]?.clientId || '?'}`) : null;

        return (
            <Group key={option.value} justify="space-between" wrap="nowrap">
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
    // --- End Fix ---

    return (
        <Select
            label="Mesa / Área"
            placeholder={loading ? 'Carregando áreas...' : 'Selecione uma área'}
            data={selectData} // Pass our extended SelectItem array
            value={selectedAreaId?.toString() || null}
            onChange={handleChange}
            searchable
            clearable
            disabled={loading || disabled}
            nothingFoundMessage="Nenhuma área encontrada"
            renderOption={renderSelectOption} // Use the renderer with the cast
            leftSection={loading ? <Loader size="xs" /> : <Armchair size={16} />}
        />
    );
}