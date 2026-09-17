from pathlib import Path
root=Path(__file__).resolve().parents[2]
schema=root/'backend/prisma/schema.prisma'
text=schema.read_text()
start=text.index('model EnergyHourly {')
end=text.index('\n}',start)
if 'energy_hourly_cups_info_dt' not in text[start:end]:
    text=text[:end]+'\n  @@index([cupsId, infoDt], map: "energy_hourly_cups_info_dt")'+text[end:]
schema.write_text(text)
(root/'sql/migrations/004_consumption_history_index.sql').write_text('-- Supports latest reading and date range lookups without scanning all meter history.\nCREATE INDEX IF NOT EXISTS energy_hourly_cups_info_dt ON energy_hourly (cups_id, info_dt);\n')
p=root/'calculadora/src/app/pages/calculate/calculate.component.ts'
text=p.read_text()
text=text.replace('this.addedAreas = [...this.addedAreas];','this.addedAreas = this.addedAreas.map(area => area.id === this.selectedCadastre.id ? this.selectedCadastre : area);')
text=text.replace("    const requestedCups = house.consumptionCupsId;\n", "    const requestedCups = house.consumptionCupsId;\n    const requestedCommunity = this.selectedCommunity.id;\n")
text=text.replace('this.energyAreasService.consumption(this.selectedCommunity.id, requestedCups)','this.energyAreasService.consumption(requestedCommunity, requestedCups)')
text=text.replace("if (this.selectedCadastre !== house || house.consumptionCupsId !== requestedCups || house.consumptionSource === 'manual') return;", "if (this.selectedCadastre !== house || this.selectedCommunity?.id !== requestedCommunity || house.consumptionCupsId !== requestedCups || house.consumptionSource === 'manual') return;")
text=text.replace("    } catch {\n      house.consumptionSource = 'unavailable';", "    } catch {\n      if (this.selectedCadastre !== house || this.selectedCommunity?.id !== requestedCommunity || house.consumptionCupsId !== requestedCups || house.consumptionSource === 'manual') return;\n      house.consumptionSource = 'unavailable';")
p.write_text(text)
print('Applied history index migration, selection replacement and consumption request race guards.')
