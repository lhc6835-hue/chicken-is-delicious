# 꼬꼬 대시 (Kkokko Dash)

닭이 달리는 픽셀아트 러너 게임. `index.html`을 브라우저로 열면 바로 플레이할 수 있어요 (GitHub Pages 그대로 가능).

## 조작
- **스페이스 / 화면 터치**: 점프. 길게 누를수록 높이 뜀
- **공중에서 꾹 누르기**: 날개 퍼덕이며 천천히 활공 (머리 위 게이지)
- **P / ESC**: 일시정지

## 요소
- 발판: 땅/구덩이(물), 나무 발판, 움직이는 발판, 무너지는 돌 발판, 구름, 스프링
- 장애물: 울타리, 나무상자(2단), 건초더미, 가시덤불, 까마귀(위에서 밟으면 보너스)
- 아이템: 🚀 부스터(누르면 비행 + 하늘 코인길), ⚡ 배속(초고속 + 장애물 파괴 + 점수 2배), 🧲 자석, 💗 방패, 🥚 황금알(코인 폭탄), 보석
- 코인 콤보(음계가 올라가는 효과음, 10/25/50/100 콤보 이펙트), 500m마다 SPEED UP, 900m마다 시간대 변경(낮→노을→밤→새벽)
- 상점: 스킨 10종, 모자 10종, 트레일 7종, 강화 5종(5단계), 소모 아이템 3종
- 황금알 뽑기, 출석 보상(7일), 미션 3개(깰수록 어려워짐), 기록, 부활, 설정

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
- 효과음: Kenney — Digital Audio, Impact Sounds, Interface Sounds, Music Jingles (kenney.nl), CC0
- 폰트: [Galmuri](https://github.com/quiple/galmuri) (SIL OFL 1.1, `assets/fonts/GALMURI-OFL.md`)
- 닭 도트: 제공된 레퍼런스 이미지를 기반으로 다시 찍음
