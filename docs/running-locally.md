# 로컬에서 실행하기

이 프로젝트는 빌드 과정이 없는 순수 정적 파일(HTML/CSS/JS)입니다.
다만 서비스워커, PWA manifest, 마이크(숨 세기 감지) 기능은 `file://`로 직접 열면 정상 동작하지 않으므로 반드시 로컬 HTTP 서버로 열어야 합니다.

---

## 실행 방법

프로젝트 루트(`smoko/`)에서 아래 중 하나를 실행하세요.

**Python (대부분 PC에 기본 설치됨)**
```bash
python -m http.server 8000
```

**Node.js (설치 없이 npx로 바로 실행)**
```bash
npx serve -l 8000
```

실행 후 브라우저에서 접속:
```
http://localhost:8000
```

## 서버 끄기

명령어를 실행한 터미널에서 `Ctrl + C`.

---

## 참고

- `index.html`을 더블클릭해서 `file://`로 열면 화면 대부분은 보이지만, 서비스워커 캐시와 흡연 화면의 마이크 숨 세기 감지 기능은 동작하지 않습니다 (마이크는 HTTPS 또는 `localhost` 같은 보안 컨텍스트에서만 허용됨).
- 배포본은 `master`에 push하면 Vercel(`https://smoko-three.vercel.app/`)에 자동 반영됩니다. 로컬 서버는 배포 전 확인용입니다.
