SELECT
  `zertipower-dev`.`energy_registers`.`cups_id` AS `cups_id`,
  year(`zertipower-dev`.`energy_registers`.`info_dt`) AS `year`,
  MONTH(`zertipower-dev`.`energy_registers`.`info_dt`) AS `month`,
  sum(`zertipower-dev`.`energy_registers`.`import`) AS `import`,
  sum(
    `zertipower-dev`.`energy_registers`.`consumption`
  ) AS `consumption`,
  sum(`zertipower-dev`.`energy_registers`.`export`) AS `export`,
  sum(`zertipower-dev`.`energy_registers`.`generation`) AS `generation`
FROM
  `zertipower-dev`.`energy_registers`
GROUP BY
  `zertipower-dev`.`energy_registers`.`cups_id`,
  year(`zertipower-dev`.`energy_registers`.`info_dt`),
  MONTH(`zertipower-dev`.`energy_registers`.`info_dt`)
ORDER BY
  `zertipower-dev`.`energy_registers`.`cups_id`,
  MONTH(`zertipower-dev`.`energy_registers`.`info_dt`)