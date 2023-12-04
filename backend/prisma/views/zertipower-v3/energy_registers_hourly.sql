SELECT
  `zertipower-v3`.`energy_registers`.`cups_id` AS `cups_id`,
  date_format(
    `zertipower-v3`.`energy_registers`.`info_dt`,
    '%Y-%m-%d %H:00:00'
  ) AS `datehour`,
  sum(`zertipower-v3`.`energy_registers`.`import`) AS `total_import`,
  sum(`zertipower-v3`.`energy_registers`.`consumption`) AS `total_consumption`,
  sum(`zertipower-v3`.`energy_registers`.`export`) AS `total_export`,
  sum(`zertipower-v3`.`energy_registers`.`generation`) AS `total_generation`,
CASE
    WHEN sum(`zertipower-v3`.`energy_registers`.`generation`) - sum(`zertipower-v3`.`energy_registers`.`import`) < 0 THEN 0
    ELSE sum(`zertipower-v3`.`energy_registers`.`generation`) - sum(`zertipower-v3`.`energy_registers`.`import`)
  END AS `surplus`,
  `zertipower-v3`.`energy_blocks`.`reference` AS `REFERENCE`,
  `zertipower-v3`.`energy_blocks`.`consumption_price` AS `consumption_price`,
  `zertipower-v3`.`energy_blocks`.`generation_price` AS `generation_price`,
  sum(`zertipower-v3`.`energy_registers`.`import`) * `zertipower-v3`.`energy_blocks`.`consumption_price` AS `consumption_cost`,
  sum(`zertipower-v3`.`energy_registers`.`generation`) * `zertipower-v3`.`energy_blocks`.`generation_price` AS `generation_cost`
FROM
  (
    `zertipower-v3`.`energy_registers`
    LEFT JOIN `zertipower-v3`.`energy_blocks` ON(
      date_format(
        `zertipower-v3`.`energy_registers`.`info_dt`,
        '%Y-%m-%d %H:00:00'
      ) BETWEEN `zertipower-v3`.`energy_blocks`.`active_init`
      AND `zertipower-v3`.`energy_blocks`.`active_end`
    )
  )
GROUP BY
  date_format(
    `zertipower-v3`.`energy_registers`.`info_dt`,
    '%Y-%m-%d %H:00:00'
  ),
  `zertipower-v3`.`energy_registers`.`cups_id`
ORDER BY
  `zertipower-v3`.`energy_registers`.`cups_id`