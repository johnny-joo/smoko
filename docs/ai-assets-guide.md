# AI 이미지·영상 생성 가이드

이 사이트에 쓸 에셋을 AI로 만드는 방법과 각 씬별 프롬프트를 정리합니다.

---

## 이미지 생성 도구 추천

### 1순위 — Midjourney (v6 / v7)
- 가장 높은 품질, 일관된 무드 유지에 유리
- 웹: [midjourney.com](https://www.midjourney.com)
- 유료 (월 $10~)

### 2순위 — Adobe Firefly
- Photoshop 통합, 상업적 사용 안전
- 웹: [firefly.adobe.com](https://firefly.adobe.com)
- Adobe Creative Cloud 구독 포함 or 무료 크레딧

### 3순위 — DALL·E 3 (ChatGPT Plus)
- 한국어 프롬프트 지원
- ChatGPT Plus 구독 필요 (월 $20)

### 4순위 — Stable Diffusion (로컬)
- 무료, AUTOMATIC1111 or ComfyUI
- 설치 필요, GPU 권장
- 모델 추천: `Realistic Vision v6`, `DreamShaper XL`

---

## 영상 생성 도구 추천

### Runway Gen-3 Alpha
- 텍스트/이미지 → 영상, 최고 품질
- 웹: [runwayml.com](https://runwayml.com)
- 유료 크레딧제

### Kling AI (클링)
- 한국에서 접근 쉬움, 고품질 영상
- 웹: [klingai.com](https://klingai.com)

### Pika Labs
- 빠른 생성, 루프 영상에 강함
- 웹: [pika.art](https://pika.art)

---

## 씬별 AI 생성 프롬프트

### Scene 1 — 편의점 배경 이미지

**용도:** `#scene-store` 배경 이미지

```
Prompt (영문):
Korean convenience store interior at night, cigarette display shelf close-up,
neon signs, warm fluorescent lighting, photorealistic, cinematic composition,
35mm lens, shallow depth of field, moody ambiance, no people

네거티브: blurry, cartoon, anime, text, watermark
비율: 16:9 또는 9:16 (모바일)
```

---

### Scene 2 — 엘리베이터 내부 영상

**용도:** 엘리베이터 배경 루프 영상 (`assets/elevator.mp4`)

```
Prompt (영문):
Interior of a Korean office building elevator, stainless steel walls,
fluorescent ceiling light, descending from floor 11 to basement B1,
subtle camera shake, seamless loop, cinematic, no people

Runway / Kling 권장
길이: 6~8초 루프
```

---

### Scene 3 — 흡연 정원 배경 이미지

**용도:** `#scene-garden` 배경 교체

```
Prompt (영문):
Rooftop or basement smoking area in a Korean office building,
small urban garden with potted plants, afternoon sunlight,
ashtray on railing, blurred city background, warm summer atmosphere,
photorealistic, 16:9, cinematic

네거티브: people smoking, cigarettes, blurry foreground
```

---

### Scene 4 — 연기 배경 / 분위기 이미지

**용도:** `#scene-smoke` 배경 오버레이 텍스처

```
Prompt (영문):
Soft white cigarette smoke wisps on dark background, abstract,
flowing upward, bokeh, studio lighting, high contrast, no subject,
texture overlay, alpha channel preferred

PNG 투명 배경 권장
Stable Diffusion: "smoke texture, isolated on black, alpha"
```

---

### 담배갑 일러스트 (선택사항)

**용도:** Scene 1 담배 카드 이미지 교체

```
Prompt (각 담배별로 변형):
Minimalist cigarette pack design, [brand name style], [color] color scheme,
flat lay on white surface, product photography style, clean, commercial

예시:
- "green menthol cigarette pack, minimalist, flat design, product shot"
- "red classic cigarette pack, marlboro style, vintage feel, product photography"
```

---

## 에셋 적용 방법

### 이미지 적용

```css
/* style.css에서 해당 씬 배경 교체 */
#scene-store {
  background-image: url('assets/convenience-store.jpg');
  background-size: cover;
  background-position: center;
}

#scene-garden {
  background-image: url('assets/smoking-garden.jpg');
  background-size: cover;
}
```

### 영상 적용 (엘리베이터)

```html
<!-- index.html scene-elevator 안에 추가 -->
<video class="scene-bg-video" autoplay muted loop playsinline>
  <source src="assets/elevator.mp4" type="video/mp4" />
</video>
```

```css
/* style.css */
.scene-bg-video {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  opacity: 0.5;
  z-index: 0;
}
```

---

## 에셋 파일 네이밍 규칙

```
assets/
├── bg-store.jpg          # 편의점 배경
├── bg-garden.jpg         # 흡연 정원 배경
├── bg-smoke-texture.png  # 연기 텍스처 (투명 PNG)
├── elevator.mp4          # 엘리베이터 영상 (루프)
├── cig-esse.png          # 에쎄 담배갑
├── cig-marlboro.png      # 말보로 담배갑
├── cig-raison.png        # 레종 담배갑
├── cig-tobplus.png       # 토브플러스 담배갑
├── cig-lm.png            # L&M 담배갑
└── audio/
    ├── bgm-store.mp3
    ├── bgm-elevator.mp3
    ├── bgm-garden.mp3
    ├── bgm-lofi.mp3
    ├── sfx-lighter.mp3
    └── sfx-exhale.mp3
```

---

## 저작권 주의사항

- 실제 담배 브랜드 로고/패키지 이미지는 **상업적 사용 불가**
- AI 생성 이미지 사용 시 각 플랫폼의 상업적 이용 약관 확인 필요
  - Midjourney Pro 이상: 상업적 사용 가능
  - Adobe Firefly: 상업적 사용 가능 (IP 보호 모델)
  - DALL·E 3: ChatGPT Plus 사용자는 상업적 사용 가능
- 담배 광고 관련 법규 (「국민건강증진법」) 참고: 온라인 담배 광고 제한 있음
  - 이 사이트는 **시뮬레이션/오락 목적**임을 명시하는 것 권장
