"""Contract tests for the optional native ForeFire plan bank."""

from __future__ import annotations

import shutil
import unittest
from pathlib import Path

from . import prepare_forefire_bank as bank


class ForeFireBankTest(unittest.TestCase):
    def test_filtered_arrivals_exclude_treatment_and_zero_fuel(self) -> None:
        scenario = {
            "fuelClassIndices": [0] * 3600,
            "treatmentCells": [2, 4],
            "protectedAssetIndices": [1, 2, 3],
        }
        scenario["fuelClassIndices"][1] = 1
        scenario["fuelClassIndices"][3] = 1
        raw = {"arrivalSeconds": [None] * 3600, "reachableCells": 4, "frontSteps": 5}
        raw["arrivalSeconds"][1] = 10
        raw["arrivalSeconds"][2] = 20
        raw["arrivalSeconds"][3] = 30
        raw["arrivalSeconds"][4] = 40
        result = bank._filtered(raw, scenario)
        self.assertEqual(result["arrivalSeconds"][1], 10)
        self.assertIsNone(result["arrivalSeconds"][2])
        self.assertEqual(result["arrivalSeconds"][3], 30)
        self.assertIsNone(result["arrivalSeconds"][4])
        self.assertEqual(result["excludedNonburnableArrivals"], 2)
        self.assertEqual(result["burnedCells"], 2)
        self.assertEqual(result["burnedAreaM2"], 450)
        self.assertEqual(result["refugeBurnedCells"], 2)
        self.assertEqual(result["firstArrivalSeconds"], 10)
        raw["arrivalSeconds"][3] = 480 * 60 + 1
        with self.assertRaises(bank.ForeFireBuildError):
            bank._filtered(raw, scenario)

    def test_export_enumerates_only_permitted_pairs(self) -> None:
        if shutil.which("node") is None:
            self.skipTest("Node is required for model export")
        baseline, plans = bank._export_plans(Path(__file__).with_name("model.mjs"))
        self.assertEqual(len(plans), 253)  # C(23 treatable sectors, 2)
        keys = [bank._plan_key(item["crew"]) for item in plans]
        self.assertEqual(keys, sorted(keys, key=lambda key: tuple(int(x) for x in key.split(","))))
        self.assertEqual(baseline["grid"], {"size": 60, "cellMetres": 15, "row0": "north"})
        self.assertTrue(all(item["crew"][0] < item["crew"][1] for item in plans))


if __name__ == "__main__":
    unittest.main()
