# 실재고 조사 앱

현장 실사 수량을 제조사, 상품코드 기준으로 입력하고, 한 상품 안에서 `S+S`, `SS`, `SA`, `AS`, `AA` 등급별 수량을 나눠 전산재고와 대조하는 단일 페이지 앱입니다. `B급`은 일반 등급에 섞지 않고 `5.B급` 카테고리로 따로 관리합니다.

## 실행

```powershell
node server.js
```

기본 주소는 `http://localhost:4173`입니다.

## 로그인

기본 계정은 최초 실행 시 `admin / 1234`로 생성됩니다. 로그인 화면에서 회원가입도 가능합니다.

운영 계정은 실행 전에 환경변수로 바꿀 수 있습니다.

```powershell
$env:INVENTORY_USER="사용자ID"
$env:INVENTORY_PASSWORD="비밀번호"
node server.js
```

## 구조

```text
inventory_site/
├─ index.html          # 화면 마크업
├─ server.js           # 정적 파일 서버 및 상태 저장 API
├─ data.json           # 실재고 데이터 저장소
├─ users.json          # 로그인 사용자 저장소
├─ tools/
│  └─ import_inventory_excel.py
└─ assets/
   ├─ app.js           # 화면 동작, 저장, 엑셀 내보내기
   └─ styles.css       # 업무용 UI 스타일
```

## 기존 엑셀 재고 가져오기

```powershell
python tools\import_inventory_excel.py "C:\Users\UserK\Desktop\MouseWithoutBorders\재고파악.xlsx"
```

엑셀 컬럼은 `카테고리 / 상품코드 / 상품설명 / 판매가 / 노출상태 / 전산재고` 순서로 읽습니다. 가져오기 전 기존 `data.json`은 `data.backup.*.json`으로 백업됩니다.

## API

- `GET /api/state`: 현재 재고 상태 조회
- `PUT /api/state`: 현재 재고 상태 저장
- `POST /api/reset`: 기본 상태로 초기화
- `POST /api/signup`: 사용자 가입
- `POST /api/login`: 로그인
- `POST /api/logout`: 로그아웃
