SELECT
  `zertipowerv2`.`energy_registers`.`cups_id` AS `cups_id`,
  str_to_date(
    date_format(
      `zertipowerv2`.`energy_registers`.`info_dt`,
      '%Y-%m-%d %H:00:00'
    ),
    '%Y-%m-%d %H:%i:%s'
  ) AS `info_datetime`,
  sum(`zertipowerv2`.`energy_registers`.`import`) AS `import`,
  sum(`zertipowerv2`.`energy_registers`.`consumption`) AS `consumption`,
  sum(`zertipowerv2`.`energy_registers`.`export`) AS `export`,
  sum(`zertipowerv2`.`energy_registers`.`generation`) AS `generation`
FROM
  `zertipowerv2`.`energy_registers`
GROUP BY
  date_format(
    `zertipowerv2`.`energy_registers`.`info_dt`,
    '%Y-%m-%d %H:00:00'
  ),
  `zertipowerv2`.`energy_registers`.`cups_id`