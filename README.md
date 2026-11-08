# FREE RANGE

> *Don't become dinner.*

도망치는 닭의 픽셀아트 러너 게임. `index.html`을 브라우저로 열면 바로 플레이할 수 있어요 (GitHub Pages 그대로 가능).

## 조작
- **스페이스 / 화면 터치**: 점프. 길게 누를수록 높이 뜀
- **공중에서 꾹 누르기**: 날개 퍼덕이며 천천히 활공 (머리 위 게이지)
- **P / ESC**: 일시정지

## 핵심: 병아리 기차 🐤🐤🐤
- 코스의 작은 알을 먹으면 병아리가 부화해서 뒤를 줄줄이 따라와요 (최대 15마리). **병아리 수만큼 점수 배율** (×1 → ×16).
- 병아리는 닭이 뛴 자리에서 똑같이 뛰지만 **점프가 낮고 활공을 못 해요**. 짧게 뛰거나 너무 일찍 뛰면 병아리가 장애물에 걸려 사라져요. 구덩이에 빠진 병아리는 헤엄쳐 건너고 물가에서 폴짝 뛰어 다시 올라와요.
- 닭 본체가 부딪히면 무조건 꼬꼬 다운. 부스터·배속 중엔 병아리가 닭 경로를 그대로 타서 안전해요.

## 활공 구간
- 상승기류 협곡: 점프·활공만으론 못 건너는 협곡. 바람 구멍 위에서 꾹 누르면 떠오르고 활공 게이지가 다시 차요.
- 가시덤불 밭: 점프만으론 못 넘고 활공해야 넘어가요.
- 절벽 활강: 계단 절벽을 올라 먼 땅까지 활공으로 내려가요. (절벽 옆면에 깊게 부딪히면 꼬꼬 다운)
- 깃털 고리: 활공 경로의 고리를 통과하면 코인 +3, 활공 게이지 가득.
- 이 구간들에선 병아리도 바람을 타고 따라와요.

## 요소
- 발판: 땅/구덩이(물), 나무 발판, 움직이는 발판, 무너지는 돌 발판, 구름, 스프링
- 장애물: 울타리, 나무상자(2단), 건초더미, 가시덤불, 까마귀(위에서 밟으면 보너스)
- 아이템: 🚀 부스터(누르면 비행 + 하늘 코인길), ⚡ 배속(초고속 + 장애물 파괴 + 점수 2배), 🧲 자석, 💗 방패, 🥚 황금알(코인 폭탄), 보석
- 코인 콤보(음계가 올라가는 효과음, 10/25/50/100 콤보 이펙트), 500m마다 SPEED UP, 900m마다 시간대 변경(낮→노을→밤→새벽)
- 스킨마다 고유 이펙트 (능력치는 동일): 백봉 솜털, 오골계 빛나는 눈, 딸기우유 하트, 민트초코 초코칩, 유령 부유, 황금 광택, 로봇 분사·스파크, 불사조 불꽃 오라, 무지개 반짝이 등 — 달리기/점프/착지/쓰러질 때 각각 다르게
- 상점: 스킨 10종, 모자 10종, 트레일 7종, 강화 5종(5단계), 소모 아이템 3종
- 황금알 뽑기, 출석 보상(7일), 미션 3개(깰수록 어려워짐), 기록, 부활, 설정

## 화면 전환
- 달걀 껍질: 런 시작·홈 이동 때 껍질 두 쪽이 쾅 닫혔다가 금이 가며 깨짐
- 아이리스: 잡히면 카메라가 닭 쪽으로 동그랗게 닫힘 (카툰 엔딩 스타일)
- 디더 와이프: 메뉴 사이 이동

## 개발
```
npm install
npm run build      # src/ → game.js (효과음은 data URI로 임베드)
npm run serve      # http://localhost:8080
```
이펙트 시트는 [pixelfx](https://github.com/patch-gg/pixelfx)로 굽습니다:
```
git clone https://github.com/patch-gg/pixelfx ../pixelfx
npm run bake       # assets/fx/*.png + src/fxdata.js
```

## 크레딧
- 이펙트: [pixelfx](https://github.com/patch-gg/pixelfx) (MIT) 효과들을 스프라이트 시트로 구움
- 배경음악: Juhani Junkala — *5 Chiptunes (Action)* / Retro Game Music Pack, OpenGameArt, CC0
- 효과음: Kenney — Digital Audio, Impact Sounds, Interface Sounds, RPG Audio, Music Jingles (kenney.nl), CC0 (코인 "띠링" 차임은 Web Audio로 합성)
- 폰트: [Silkscreen](https://github.com/googlefonts/silkscreen) (OFL, 로고), [Galmuri](https://github.com/quiple/galmuri) (SIL OFL 1.1, `assets/fonts/GALMURI-OFL.md`)
- 닭 도트: 제공된 레퍼런스 이미지를 기반으로 다시 찍음
