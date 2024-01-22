SELECT
  `zertipower-dev`.`energy_registers`.`cups_id` AS `cups_id`,
  str_to_date(
    date_format(
      `zertipower-dev`.`energy_registers`.`info_dt`,
      '%Y-%m-%d %H:00:00'
    ),
    '%Y-%m-%d %H:%i:%s'
  ) AS `info_datetime`,
  sum(`zertipower-dev`.`energy_registers`.`import`) AS `import`,
  sum(
    `zertipower-dev`.`energy_registers`.`consumption`
  ) AS `consumption`,
  sum(`zertipower-dev`.`energy_registers`.`export`) AS `export`,
  sum(`zertipower-dev`.`energy_registers`.`generation`) AS `generation`
FROM
  `zertipower-dev`.`energy_registers`
GROUP BY
  date_format(
    `zertipower-dev`.`energy_registers`.`info_dt`,
    '%Y-%m-%d %H:00:00'
  ),
  `zertipower-dev`.`energy_registers`.`cups_id`