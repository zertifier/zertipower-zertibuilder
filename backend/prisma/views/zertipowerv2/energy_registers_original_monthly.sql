SELECT
  `zertipowerv2`.`energy_registers`.`cups_id` AS `cups_id`,
  year(`zertipowerv2`.`energy_registers`.`info_dt`) AS `year`,
  MONTH(`zertipowerv2`.`energy_registers`.`info_dt`) AS `month`,
  sum(`zertipowerv2`.`energy_registers`.`import`) AS `import`,
  sum(`zertipowerv2`.`energy_registers`.`consumption`) AS `consumption`,
  sum(`zertipowerv2`.`energy_registers`.`export`) AS `export`,
  sum(`zertipowerv2`.`energy_registers`.`generation`) AS `generation`
FROM
  `zertipowerv2`.`energy_registers`
GROUP BY
  `zertipowerv2`.`energy_registers`.`cups_id`,
  year(`zertipowerv2`.`energy_registers`.`info_dt`),
  MONTH(`zertipowerv2`.`energy_registers`.`info_dt`)
ORDER BY
  `zertipowerv2`.`energy_registers`.`cups_id`,
  MONTH(`zertipowerv2`.`energy_registers`.`info_dt`)