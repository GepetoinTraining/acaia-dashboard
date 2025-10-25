// File: app/dashboard/pospage/components/SeatingAreaSelector.tsx
"use client";

import React, { useState, useEffect } from 'react'; // Import React for ReactNode
import { Select, Loader, ComboboxItem, Group, Text, Badge, ComboboxLikeRenderOptionInput } from '@mantine/core';
import { ApiResponse, SeatingAreaWithVisitInfo } from '@/lib/types';
import { notifications } from '@mantine/notifications';
import { Armchair } from 'lucide-react';
import { Client, Visit, SeatingArea } from '@prisma/client';

// Type for the items in the Select dropdown, extending Mantine's base type
// Make sure this definition matches the data structure created in selectData
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
    }, []);

    // Prepare data ensuring it matches SelectItem structure
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

    // --- FIX: Define render function with explicit cast and correct return type ---
    const renderSelectOption = (itemProps: ComboboxLikeRenderOptionInput<ComboboxItem>): React.ReactNode => {
        // Cast the generic ComboboxItem to our specific SelectItem
        const option = itemProps.option as SelectItem;

        // Defensive check in case casting fails or data is malformed
        if (!option || !option.area) {
             console.error("Render option issue: ", itemProps);
             return <span>Opção Inválida</span>; // Fallback UI
        }

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
            renderOption={renderSelectOption} // Use the renderer with the explicit cast
            leftSection={loading ? <Loader size="xs" /> : <Armchair size={16} />}
        />
    );
}