'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { useCurrency } from '@/contexts/currency-context';
import type { HoldingSummary, AssetType } from '@/types/api';

const assetTypeBadges: Record<AssetType, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  STOCK: { label: 'Acción', variant: 'default' },
  ETF: { label: 'ETF', variant: 'secondary' },
  CRYPTO: { label: 'Cripto', variant: 'outline' },
  BOND: { label: 'Bono', variant: 'secondary' },
  MUTUAL_FUND: { label: 'Fondo', variant: 'outline' },
  OTHER: { label: 'Otro', variant: 'outline' },
};

interface HoldingsTableProps {
  holdings: HoldingSummary[];
  loading: boolean;
}

export function HoldingsTable({ holdings, loading }: HoldingsTableProps) {
  const { convertAndFormat } = useCurrency();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Cargando posiciones...</p>
        </CardContent>
      </Card>
    );
  }

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Posiciones</CardTitle>
          <CardDescription>Tu cartera de inversiones actual</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-32 text-center">
          <p className="text-muted-foreground">
            No tienes posiciones abiertas
          </p>
          <p className="text-sm text-muted-foreground">
            Registra tu primera compra para comenzar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Posiciones</CardTitle>
        <CardDescription>Tu cartera de inversiones actual</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activo</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Precio Medio</TableHead>
              <TableHead className="text-right">Invertido</TableHead>
              <TableHead className="text-right">Precio Actual</TableHead>
              <TableHead className="text-right">Valor Actual</TableHead>
              <TableHead className="text-right">P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((holding) => {
              const quantity = parseFloat(holding.quantity);
              const avgCost = parseFloat(holding.averageCost);
              const invested = parseFloat(holding.totalInvested);
              const currentPrice = holding.currentPrice ? parseFloat(holding.currentPrice) : null;
              const currentValue = holding.currentValue ? parseFloat(holding.currentValue) : null;
              const pnl = holding.unrealizedPnL ? parseFloat(holding.unrealizedPnL) : null;
              const pnlPercent = holding.unrealizedPnLPercent ? parseFloat(holding.unrealizedPnLPercent) : null;
              const badgeInfo = assetTypeBadges[holding.type as AssetType] || assetTypeBadges.OTHER;

              // Skip if no position
              if (quantity <= 0) return null;

              return (
                <TableRow key={holding.assetId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{holding.symbol}</div>
                        <div className="text-sm text-muted-foreground">{holding.name}</div>
                      </div>
                      <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {quantity.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {convertAndFormat(avgCost, holding.currency)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {convertAndFormat(invested, holding.currency)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {currentPrice !== null 
                      ? convertAndFormat(currentPrice, holding.currency)
                      : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {currentValue !== null 
                      ? convertAndFormat(currentValue, holding.currency)
                      : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {pnl !== null ? (
                      <div className={`flex items-center justify-end gap-1 ${
                        pnl >= 0 ? 'text-green-600 dark:text-green-500' : 'text-foreground'
                      }`}>
                        {pnl >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <div className="text-right">
                          <div className="font-mono">
                            {pnl >= 0 ? '+' : ''}{convertAndFormat(pnl, holding.currency)}
                          </div>
                          {pnlPercent !== null && (
                            <div className="text-xs">
                              {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
