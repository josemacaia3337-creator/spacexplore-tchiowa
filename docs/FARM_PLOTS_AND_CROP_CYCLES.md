# Stage 2 — Talhões e ciclos de cultura

A Etapa 2 transforma a fazenda registada numa unidade operacional de maneio:
- Divide a propriedade em talhões georreferenciados.
- Associa uma cultura, variedade, datas e estado a cada talhão.
- Calcula a área geodésica de cada talhão com PostGIS.
- Rejeita polígonos fora da fazenda e sobreposições materiais entre talhões.
- Mantém histórico de ciclos por talhão; apenas um ciclo pode estar planeado/plantado/em crescimento de cada vez.
- Permite associar observações, pragas/doenças reportadas, fertilização, tratamentos, plantio e colheita ao talhão e ciclo específicos.

## Qualidade e limites
Cultura, variedade, datas e estado são fornecidos pelo agricultor/equipa. A data de colheita prevista é um dado de planeamento, não uma previsão científica. Suspeitas de pragas/doenças não são diagnósticos automáticos. Os polígonos são referências operacionais, não cadastro nem prova de propriedade.

## Segurança
RLS nas duas novas tabelas; permissões baseadas em membership/role existentes; RPC de criação SECURITY INVOKER; chaves estrangeiras compostas impedem ligar registos a talhões/ciclos de outra fazenda ou organização.
