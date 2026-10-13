"""Extract the official directory, preserving merged rows across page boundaries."""
import json
import re
from pathlib import Path

SOURCE = 'https://www.vimawa.gov.vn/vi/noi-dung/ve-viec-cong-bo-danh-muc-ben-cang-cau-cang-thuoc-cac-cang-bien-viet-nam'
NORTH = {'Quảng Ninh', 'Hải Phòng', 'Thái Bình', 'Nam Định'}
SOUTH = {'Bình Dương', 'Bình Thuận', 'Bà Rịa – Vũng Tàu', 'Bà Rịa - Vũng Tàu', 'Thành phố Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Đồng Nai', 'Long An', 'Tiền Giang', 'Bến Tre', 'Đồng Tháp', 'Vĩnh Long', 'Cần Thơ', 'Hậu Giang', 'Sóc Trăng', 'Trà Vinh', 'An Giang', 'Kiên Giang', 'Cà Mau'}

def clean(value):
    return ' '.join((value or '').split())

def parse_rows(rows, appendix):
    result, current, parent, seen = [], None, '', set()
    for page, row in rows:
        if len(row) not in (3,4) or clean(row[0]) == 'TT': continue
        raw_id, name = clean(row[0]), clean(row[1])
        group = clean(row[-1])
        if group: parent = group
        if re.fullmatch(r'\d+\.', raw_id):
            ordinal = int(raw_id[:-1])
            if ordinal in seen: raise ValueError(f'Duplicate ordinal {ordinal}')
            seen.add(ordinal)
            current = dict(sourceId='505-QD-BXD-2026', appendix=appendix, ordinal=ordinal,
                internalCode=f'VN-SEA-{appendix}-{ordinal:03}', nameVi=name, nameEn=None,
                seaportName=parent.replace(' – ', ' - '), region='north' if parent in NORTH else 'south' if parent in SOUTH else 'central',
                sourceLocation=parent, address=None, latitude=None, longitude=None,
                coordinateAccuracy='unknown', operationalStatus='unverified', website=None, stockTicker=None,
                officialCodes=[], sourcePages=[page], sources=dict(directory=SOURCE, codes=None, coordinates=None, operation=None), verifiedAt=None)
            result.append(current)
        elif current:
            if page not in current['sourcePages']: current['sourcePages'].append(page)
            if name: current['nameVi'] = clean(current['nameVi']+' '+name)
    return result

def main():
    import pdfplumber
    root=Path(__file__).resolve().parents[1]
    records=[]
    with pdfplumber.open(root/'data/sources/505-2026.pdf') as pdf:
        for appendix, start, end in [('I',2,26),('II',26,27)]:
            rows=[]
            for index in range(start,end):
                for table in pdf.pages[index].extract_tables():
                    if table and len(table[0]) in (3,4):
                        rows.extend((index+1,row) for row in table)
            records.extend(parse_rows(rows,appendix))
    for a, expected in [('I',309),('II',14)]:
        actual=[r['ordinal'] for r in records if r['appendix']==a]
        if actual!=list(range(1,expected+1)): raise ValueError(f'Incomplete appendix {a}: {actual}')
    if any(not r['nameVi'] or not r['seaportName'] for r in records): raise ValueError('Missing name or parent')
    (root/'data/port-directory.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
    print(f'Extracted {len(records)} terminals; I:309, II:14. All ordinals continuous.')
    print('Parents:', sorted(set(r['seaportName'] for r in records)))

if __name__=='__main__': main()
