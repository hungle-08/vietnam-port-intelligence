import importlib.util
import unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location('collector', Path(__file__).parents[1] / 'scripts/collect-port-directory.py')
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)

class CollectorTest(unittest.TestCase):
    def test_cross_page_terminal_keeps_one_id_and_parent(self):
        rows = [
            (3, ['1.', 'Bến cảng Vạn Gia', 'Cầu cảng 1', 'Quảng\nNinh']),
            (3, ['2.', '', 'Cầu cảng Tạm', None]),
            (4, ['', 'Bến cảng tổng hợp Cái Lân', 'Cầu cảng 1', '']),
            (4, [None, None, 'Cầu cảng 2', None]),
            (4, ['3.', 'Bến cảng Vật Cách', 'Cầu cảng 1', 'Hải Phòng']),
        ]
        result = collector.parse_rows(rows, 'I')
        self.assertEqual(len(result), 3)
        self.assertEqual(result[1]['nameVi'], 'Bến cảng tổng hợp Cái Lân')
        self.assertEqual(result[1]['seaportName'], 'Quảng Ninh')
        self.assertEqual(result[1]['internalCode'], 'VN-SEA-I-002')
        self.assertEqual(result[1]['sourcePages'], [3,4])
        self.assertIsNone(result[1]['latitude'])
        self.assertEqual(result[1]['operationalStatus'], 'unverified')
    def test_duplicate_ordinal_rejected(self):
        with self.assertRaises(ValueError):
            collector.parse_rows([(3,['1.','A','C','Quảng Ninh']),(3,['1.','B','C',None])], 'I')

if __name__ == '__main__': unittest.main()
