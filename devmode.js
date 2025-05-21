// 개발 모드 - 영역 선택 및 코드 생성 기능
function enableDevMode() {
    console.clear();
    console.log('개발자 모드가 활성화되었습니다.');

    const screenContainer = document.getElementById('screen-container');
    const buttonOverlay = document.getElementById('button-overlay');
    const currentScreen = document.getElementById('current-screen');
    const currentScreenNum = window.getCurrentScreenNum();
    
    // 선택 영역 관련 변수 초기화
    let isSelecting = false;
    let selectionBox = null;
    let startX = 0, startY = 0;
    let areaStartX = 0, areaStartY = 0;
    let areaWidth = 0, areaHeight = 0;
    
    // 기존 개발자 패널이 있으면 제거
    const existingPanel = document.querySelector('.dev-panel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    // 개발 모드 UI 생성
    const devPanel = document.createElement('div');
    devPanel.className = 'dev-panel';
    devPanel.innerHTML = `
        <div class="panel-header">
            <h3>개발자 모드</h3>
            <button id="minimize-dev-panel" title="최소화">_</button>
            <button id="stop-dev-mode" title="닫기">×</button>
        </div>
        <div class="panel-content">
            <div>
                <button id="create-area-btn">영역 생성</button>
            </div>
            <div id="area-info" style="margin-top: 10px;">
                <p>이미지를 클릭하여 좌표를 확인하세요</p>
                <div id="coords-display"></div>
            </div>
            <div id="code-output" style="margin-top: 10px;">
                <textarea id="generated-code" rows="6" style="width: 100%; font-family: monospace;"></textarea>
                <button id="copy-code-btn">코드 복사</button>
                <button id="save-to-json-btn">JSON에 저장</button>
            </div>
            
            <div id="common-button-tools" style="margin-top: 15px; border-top: 1px solid #555; padding-top: 10px;">
                <h4>공통 버튼 도구</h4>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                    <div>
                        <label>버튼 이름:</label>
                        <input type="text" id="common-btn-name" placeholder="home, back 등" style="width: 120px; margin-left: 5px;">
                    </div>
                    <div>
                        <label>화면 범위:</label>
                        <input type="number" id="screen-range-start" min="1" max="17" value="2" style="width: 50px;"> -
                        <input type="number" id="screen-range-end" min="1" max="17" value="16" style="width: 50px;">
                    </div>
                    <div>
                        <label>이동할 화면:</label>
                        <input type="number" id="target-screen" min="1" max="17" value="1" style="width: 50px;">
                    </div>
                    <div>
                        <button id="create-common-btn">공통 버튼 생성</button>
                        <button id="apply-common-btn">기존 공통 버튼 적용</button>
                    </div>
                </div>
                <div id="common-code-output" style="margin-top: 10px;">
                    <textarea id="common-button-code" rows="6" style="width: 100%; font-family: monospace;"></textarea>
                    <button id="save-common-to-json-btn">JSON에 저장</button>
                </div>
            </div>
        </div>
    `;
    
    // 스타일 추가
    const devStyle = document.createElement('style');
    devStyle.textContent = `
        .dev-panel {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 0;
            border-radius: 5px;
            z-index: 9999;
            width: 350px;
            font-family: sans-serif;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            resize: both;
            min-width: 250px;
            min-height: 200px;
        }
        .panel-header {
            background: #333;
            padding: 8px 15px;
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 5px 5px 0 0;
            border-bottom: 1px solid #444;
        }
        .panel-header h3 {
            margin: 0;
            padding: 0;
            font-size: 16px;
            flex-grow: 1;
        }
        .panel-header button {
            background: transparent;
            border: none;
            color: #ccc;
            cursor: pointer;
            font-size: 16px;
            width: 24px;
            height: 24px;
            margin-left: 8px;
            padding: 0;
            line-height: 1;
        }
        .panel-header button:hover {
            color: white;
        }
        .panel-content {
            padding: 15px;
            overflow-y: auto;
        }
        .dev-panel h4 {
            margin: 5px 0;
        }
        .dev-panel button {
            margin: 5px 5px 5px 0;
            padding: 6px 12px;
            background: #555;
            color: white;
            border: none;
            border-radius: 3px;
        }
        .dev-panel button:hover {
            background: #666;
        }
        .dev-panel input {
            padding: 4px;
            border-radius: 3px;
            border: 1px solid #ccc;
        }
        .selection-box {
            position: absolute;
            border: 2px dashed yellow;
            background: rgba(255, 255, 0, 0.2);
            pointer-events: none;
        }
        .area-handle {
            position: absolute;
            width: 8px;
            height: 8px;
            background: white;
            border: 1px solid black;
        }
        .dev-panel.minimized .panel-content {
            display: none;
        }
        .dev-panel.minimized {
            width: auto !important;
            height: auto !important;
            resize: none;
        }
    `;
    
    document.body.appendChild(devStyle);
    document.body.appendChild(devPanel);
    
    // 드래그 기능 구현
    let isDragging = false;
    let offsetX, offsetY;
    
    const panelHeader = devPanel.querySelector('.panel-header');
    panelHeader.addEventListener('mousedown', function(e) {
        isDragging = true;
        offsetX = e.clientX - devPanel.getBoundingClientRect().left;
        offsetY = e.clientY - devPanel.getBoundingClientRect().top;
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        
        // 화면 영역을 벗어나지 않도록 제한
        const maxX = window.innerWidth - devPanel.offsetWidth;
        const maxY = window.innerHeight - devPanel.offsetHeight;
        
        devPanel.style.left = `${Math.max(0, Math.min(maxX, x))}px`;
        devPanel.style.top = `${Math.max(0, Math.min(maxY, y))}px`;
        devPanel.style.right = 'auto';
    });
    
    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
    
    // 최소화 버튼 기능
    const minimizeBtn = document.getElementById('minimize-dev-panel');
    minimizeBtn.addEventListener('click', function() {
        devPanel.classList.toggle('minimized');
        this.textContent = devPanel.classList.contains('minimized') ? '□' : '_';
    });
    
    // 기존 clickable-area 시각화
    document.querySelectorAll('.clickable-area').forEach(area => {
        area.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        area.style.border = '2px dashed red';
    });
    
    // 좌표 표시 요소
    const coordsDisplay = document.getElementById('coords-display');
    const generatedCode = document.getElementById('generated-code');
    const commonButtonCode = document.getElementById('common-button-code');

    // 이미지 클릭 이벤트
    currentScreen.addEventListener('click', function(e) {
        if (isSelecting) return;
        
        // 이미지의 실제 크기와 위치 가져오기
        const imgRect = currentScreen.getBoundingClientRect();
        const containerRect = screenContainer.getBoundingClientRect();
        
        // 디버깅 정보
        console.log('이미지 영역:', imgRect);
        console.log('컨테이너 영역:', containerRect);
        console.log('클릭 위치(브라우저):', e.clientX, e.clientY);
        console.log('윈도우 스케일 비율:', window.scaleRatio);
        
        // 이미지가 로드되지 않았거나 크기가 없는 경우 처리
        if (!imgRect.width || !imgRect.height) {
            console.error('이미지 크기를 가져올 수 없습니다');
            return;
        }
        
        // 이미지 내 클릭 위치 (CSS 픽셀)
        const clickXWithinImage = e.clientX - imgRect.left;
        const clickYWithinImage = e.clientY - imgRect.top;
        
        console.log('이미지 내 클릭 위치(CSS 픽셀):', clickXWithinImage, clickYWithinImage);
        
        // 원본 이미지의 크기 (config에서 가져온 값)
        const originalWidth = window.config ? window.config.imageWidth : 2498;
        const originalHeight = window.config ? window.config.imageHeight : 1440;
        
        // 표시된 이미지 크기와 원본 비율
        const widthRatio = originalWidth / imgRect.width;
        const heightRatio = originalHeight / imgRect.height;
        
        console.log('이미지 비율:', widthRatio, heightRatio);
        
        // 원본 이미지 내 좌표로 변환
        const x = Math.round(clickXWithinImage * widthRatio);
        const y = Math.round(clickYWithinImage * heightRatio);
        
        // 값이 유효한지 확인
        const validX = !isNaN(x) ? x : 0;
        const validY = !isNaN(y) ? y : 0;
        
        console.log('계산된 원본 좌표:', validX, validY);
        
        coordsDisplay.innerHTML = `클릭 위치: x=${validX}, y=${validY}`;
        
        const code = generateCode(validX, validY, 75, 57);
        generatedCode.value = code;
    });
    
    // 영역 생성 버튼 이벤트
    document.getElementById('create-area-btn').addEventListener('click', function() {
        if (isSelecting) {
            isSelecting = false;
            this.textContent = '영역 생성';
            currentScreen.removeEventListener('mousedown', startSelection);
            return;
        }
        
        this.textContent = '영역 선택 중...';
        coordsDisplay.innerHTML = '드래그하여 영역을 선택하세요';
        
        // 기존 선택 박스 제거
        if (selectionBox) {
            selectionBox.remove();
            selectionBox = null;
        }
        
        // 마우스 다운 이벤트 - 이벤트 리스너가 중복되지 않도록 먼저 제거
        currentScreen.removeEventListener('mousedown', startSelection);
        currentScreen.addEventListener('mousedown', startSelection);
    });
    
    // 개발 모드 종료 버튼
    document.getElementById('stop-dev-mode').addEventListener('click', function() {
        document.body.removeChild(devPanel);
        document.body.removeChild(devStyle);
        if (selectionBox) selectionBox.remove();
        
        // 이벤트 리스너 제거
        currentScreen.removeEventListener('mousedown', startSelection);
        document.removeEventListener('mousemove', updateSelection);
        document.removeEventListener('mouseup', endSelection);
        
        // 버튼 시각화 복원
        document.querySelectorAll('.clickable-area').forEach(area => {
            area.style.backgroundColor = '';
            area.style.border = '';
        });
        
        // 전역 이벤트 리스너 제거
        document.removeEventListener('mousemove', function() {});
        document.removeEventListener('mouseup', function() {});
        
        console.log('개발자 모드가 종료되었습니다.');
    });
    
    // 코드 복사 버튼
    document.getElementById('copy-code-btn').addEventListener('click', function() {
        generatedCode.select();
        document.execCommand('copy');
        this.textContent = '복사됨!';
        setTimeout(() => this.textContent = '코드 복사', 2000);
    });
    
    // JSON에 저장 버튼
    document.getElementById('save-to-json-btn').addEventListener('click', function() {
        try {
            // 생성된 코드에서 JSON 객체 파싱
            const codeText = generatedCode.value.trim();
            if (!codeText) {
                alert('저장할 코드가 없습니다.');
                return;
            }
            
            // JSON 형식으로 변환
            const buttonObj = eval(`(${codeText})`);
            
            // 필요한 정보만 추출 (action 함수는 targetScreen 값으로 변환)
            const jsonButton = {
                id: buttonObj.id,
                x: buttonObj.x,
                y: buttonObj.y,
                width: buttonObj.width,
                height: buttonObj.height,
                targetScreen: currentScreenNum + 1, // 다음 화면으로
                useLeftTopPosition: buttonObj.useLeftTopPosition || true
            };
            
            // 현재 화면 번호
            const screenNum = currentScreenNum.toString();
            
            // 서버에 JSON 업데이트 요청 (여기서는 콘솔에 표시)
            console.log('버튼 정보를 JSON에 추가합니다:');
            console.log(`화면 ${screenNum}에 버튼 추가: `, jsonButton);
            
            // 실제 저장 코드 (데모 - 실제 환경에서는 서버 요청 구현 필요)
            alert(`버튼이 화면 ${screenNum}에 추가되었습니다. 서버 저장 기능이 구현되지 않았으므로 콘솔에서 확인하세요.`);
            
            // 화면에 즉시 적용 (개발 용도)
            if (!window.screenMappings[screenNum]) {
                window.screenMappings[screenNum] = [];
            }
            
            const buttonWithAction = {
                ...jsonButton,
                action: () => window.goToScreen(jsonButton.targetScreen)
            };
            
            window.screenMappings[screenNum].push(buttonWithAction);
            window.updateButtons();
            
        } catch (err) {
            console.error('버튼 저장 실패:', err);
            alert('버튼 정보를 저장하는 중 오류가 발생했습니다.');
        }
    });
    
    // 공통 버튼 생성 버튼 클릭 이벤트
    document.getElementById('create-common-btn').addEventListener('click', function() {
        const buttonName = document.getElementById('common-btn-name').value.trim();
        if (!buttonName) {
            alert('버튼 이름을 입력하세요');
            return;
        }
        
        const startScreen = parseInt(document.getElementById('screen-range-start').value);
        const endScreen = parseInt(document.getElementById('screen-range-end').value);
        const targetScreen = parseInt(document.getElementById('target-screen').value);
        
        if (isNaN(startScreen) || isNaN(endScreen) || isNaN(targetScreen)) {
            alert('유효한 숫자를 입력하세요');
            return;
        }
        
        if (startScreen > endScreen) {
            alert('시작 화면은 종료 화면보다 작거나 같아야 합니다');
            return;
        }
        
        // 이미지의 실제 크기와 위치 가져오기
        const imgRect = currentScreen.getBoundingClientRect();
        // 이미지의 원래 크기와 표시된 크기 간의 비율 계산
        const scaleRatio = 1 / window.scaleRatio; // 스케일 비율의 역수
        
        let x, y, width, height;
        
        if (selectionBox) {
            // 선택된 영역이 있는 경우 해당 영역 사용
            const boxRect = selectionBox.getBoundingClientRect();
            
            // 선택 박스의 좌표를 이미지 내 상대적 위치로 변환 (원본 이미지 크기 기준)
            const left = (boxRect.left - imgRect.left) * scaleRatio;
            const top = (boxRect.top - imgRect.top) * scaleRatio;
            width = boxRect.width * scaleRatio;
            height = boxRect.height * scaleRatio;
            
            // 중앙 좌표 계산
            x = Math.round(left);
            y = Math.round(top);
            width = Math.round(width);
            height = Math.round(height);
        } else {
            // 기본값 사용
            x = 0;
            y = 165;
            width = 75;
            height = 57;
        }
        
        // 공통 버튼 코드 생성
        const commonBtnCode = generateCommonButtonCode(buttonName, x, y, width, height, targetScreen, startScreen, endScreen);
        commonButtonCode.value = commonBtnCode;
    });
    
    // JSON에 공통 버튼 저장
    document.getElementById('save-common-to-json-btn').addEventListener('click', function() {
        try {
            // 버튼 정보 가져오기
            const buttonName = document.getElementById('common-btn-name').value.trim();
            if (!buttonName) {
                alert('버튼 이름을 입력하세요');
                return;
            }
            
            const startScreen = parseInt(document.getElementById('screen-range-start').value);
            const endScreen = parseInt(document.getElementById('screen-range-end').value);
            const targetScreen = parseInt(document.getElementById('target-screen').value);
            
            // 선택 영역이나 기본값에서 가져온 좌표
            let x, y, width, height;
            const imgRect = currentScreen.getBoundingClientRect();
            const scaleRatio = 1 / window.scaleRatio;
            
            if (selectionBox) {
                const boxRect = selectionBox.getBoundingClientRect();
                x = Math.round((boxRect.left - imgRect.left) * scaleRatio);
                y = Math.round((boxRect.top - imgRect.top) * scaleRatio);
                width = Math.round(boxRect.width * scaleRatio);
                height = Math.round(boxRect.height * scaleRatio);
            } else {
                x = 0;
                y = 165;
                width = 75;
                height = 57;
            }
            
            // 공통 버튼 객체 생성
            const commonButton = {
                id: `btn-${buttonName}`,
                x: x,
                y: y,
                width: width,
                height: height,
                targetScreen: targetScreen,
                useLeftTopPosition: true
            };
            
            // 범위 객체 생성
            const rangeObj = {
                buttonId: buttonName,
                startScreen: startScreen,
                endScreen: endScreen
            };
            
            // 서버에 저장 요청 (데모 - 콘솔에 표시)
            console.log('공통 버튼 정보를 JSON에 추가합니다:');
            console.log('버튼 정보:', commonButton);
            console.log('적용 범위:', rangeObj);
            
            alert('공통 버튼이 추가되었습니다. 서버 저장 기능이 구현되지 않았으므로 콘솔에서 확인하세요.');
            
            // 화면에 즉시 적용 (개발 용도)
            // 공통 버튼 등록
            window.commonButtons[buttonName] = {
                ...commonButton,
                action: () => window.goToScreen(targetScreen)
            };
            
            // 지정된 범위의 화면에 버튼 추가
            const screens = Array.from(
                { length: endScreen - startScreen + 1 }, 
                (_, i) => startScreen + i
            );
            
            screens.forEach(num => {
                if (!window.screenMappings[num]) {
                    window.screenMappings[num] = [];
                }
                
                const buttonCopy = {
                    ...window.commonButtons[buttonName],
                    id: `${window.commonButtons[buttonName].id}-screen${num}`
                };
                
                window.screenMappings[num].push(buttonCopy);
            });
            
            window.updateButtons();
        } catch (err) {
            console.error('공통 버튼 저장 실패:', err);
            alert('공통 버튼 정보를 저장하는 중 오류가 발생했습니다.');
        }
    });
    
    // 기존 공통 버튼 적용 버튼 클릭 이벤트
    document.getElementById('apply-common-btn').addEventListener('click', function() {
        const buttonName = document.getElementById('common-btn-name').value.trim();
        if (!buttonName) {
            alert('적용할 공통 버튼 이름을 입력하세요 (home, chat, settings 등)');
            return;
        }
        
        const startScreen = parseInt(document.getElementById('screen-range-start').value);
        const endScreen = parseInt(document.getElementById('screen-range-end').value);
        
        if (isNaN(startScreen) || isNaN(endScreen)) {
            alert('유효한 숫자를 입력하세요');
            return;
        }
        
        if (startScreen > endScreen) {
            alert('시작 화면은 종료 화면보다 작거나 같아야 합니다');
            return;
        }
        
        const code = `// buttons-config.json 파일에 추가할 내용:
{
  "buttonRanges": [
    {
      "buttonId": "${buttonName}",
      "startScreen": ${startScreen},
      "endScreen": ${endScreen}
    }
  ]
}`;
        
        commonButtonCode.value = code;
    });
    
    // 영역 선택 시작
    function startSelection(e) {
        e.preventDefault();
        
        // 선택 모드 활성화
        isSelecting = true;
        
        // 이미지의 실제 크기와 위치 가져오기
        const imgRect = currentScreen.getBoundingClientRect();
        
        // 시작 좌표 (화면 기준)
        startX = e.clientX;
        startY = e.clientY;
        
        // 원본 이미지의 크기 (config에서 가져온 값)
        const originalWidth = window.config ? window.config.imageWidth : 2498;
        const originalHeight = window.config ? window.config.imageHeight : 1440;
        
        // 이미지 비율 계산
        const widthRatio = originalWidth / imgRect.width;
        const heightRatio = originalHeight / imgRect.height;
        
        // 이미지 내 클릭 위치 (CSS 픽셀)
        const clickXWithinImage = e.clientX - imgRect.left;
        const clickYWithinImage = e.clientY - imgRect.top;
        
        // 선택 영역의 상대적 좌표 계산 (원본 이미지 내에서)
        areaStartX = clickXWithinImage * widthRatio;
        areaStartY = clickYWithinImage * heightRatio;
        
        console.log('선택 시작 - 이미지 내 위치:', clickXWithinImage, clickYWithinImage);
        console.log('선택 시작 - 원본 좌표:', areaStartX, areaStartY);
        
        // 선택 박스 생성
        selectionBox = document.createElement('div');
        selectionBox.className = 'selection-box';
        buttonOverlay.appendChild(selectionBox);
        
        // 마우스 이벤트 연결
        document.addEventListener('mousemove', updateSelection);
        document.addEventListener('mouseup', endSelection);
    }
    
    // 영역 선택 업데이트
    function updateSelection(e) {
        if (!isSelecting) return;
        
        // 이미지의 실제 크기와 위치 가져오기
        const imgRect = currentScreen.getBoundingClientRect();
        
        // 이미지가 로드되지 않았거나 크기가 없는 경우 처리
        if (!imgRect.width || !imgRect.height) {
            console.error('이미지 크기를 가져올 수 없습니다');
            return;
        }
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        // 원본 이미지의 크기
        const originalWidth = window.config ? window.config.imageWidth : 2498;
        const originalHeight = window.config ? window.config.imageHeight : 1440;
        
        // 이미지 비율 계산
        const widthRatio = originalWidth / imgRect.width;
        const heightRatio = originalHeight / imgRect.height;
        
        // 선택 박스 위치 계산 (이미지 기준)
        const left = Math.max(imgRect.left, Math.min(imgRect.right, Math.min(startX, currentX)));
        const top = Math.max(imgRect.top, Math.min(imgRect.bottom, Math.min(startY, currentY)));
        const right = Math.max(imgRect.left, Math.min(imgRect.right, Math.max(startX, currentX)));
        const bottom = Math.max(imgRect.top, Math.min(imgRect.bottom, Math.max(startY, currentY)));
        
        const width = right - left;
        const height = bottom - top;
        
        // 선택 박스 업데이트
        selectionBox.style.left = `${left - imgRect.left + buttonOverlay.offsetLeft}px`;
        selectionBox.style.top = `${top - imgRect.top + buttonOverlay.offsetTop}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;
        
        // 이미지 내 선택 영역 좌표 (CSS 픽셀)
        const selectionLeftInImage = left - imgRect.left;
        const selectionTopInImage = top - imgRect.top;
        
        // 상대적 좌표와 크기 계산 (원본 이미지 크기 내에서)
        const relLeft = Math.round(selectionLeftInImage * widthRatio);
        const relTop = Math.round(selectionTopInImage * heightRatio);
        areaWidth = Math.round(width * widthRatio);
        areaHeight = Math.round(height * heightRatio);
        
        console.log('선택 영역(CSS 픽셀):', selectionLeftInImage, selectionTopInImage, width, height);
        console.log('선택 영역(원본 좌표):', relLeft, relTop, areaWidth, areaHeight);
        
        // 유효한 값인지 확인
        const validLeft = !isNaN(relLeft) ? relLeft : 0;
        const validTop = !isNaN(relTop) ? relTop : 0;
        const validWidth = !isNaN(areaWidth) && areaWidth > 0 ? areaWidth : 75;
        const validHeight = !isNaN(areaHeight) && areaHeight > 0 ? areaHeight : 57;
        
        // 좌표 정보 업데이트
        coordsDisplay.innerHTML = `
            좌상단: x=${validLeft}, y=${validTop}<br>
            크기: width=${validWidth}, height=${validHeight}
        `;
        
        // 코드 생성
        generatedCode.value = generateCode(validLeft, validTop, validWidth, validHeight);
    }
    
    // 영역 선택 완료
    function endSelection() {
        if (!isSelecting) return;
        
        isSelecting = false;
        document.getElementById('create-area-btn').textContent = '영역 생성';
        
        // 이벤트 리스너 제거
        document.removeEventListener('mousemove', updateSelection);
        document.removeEventListener('mouseup', endSelection);
        
        // 선택 영역 시각화
        selectionBox.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
        selectionBox.style.border = '2px solid lime';
        
        // 완료 메시지
        coordsDisplay.innerHTML += '<br><strong>영역 선택 완료!</strong>';
    }
    
    // 코드 생성 함수
    function generateCode(x, y, width, height) {
        const nextScreen = currentScreenNum + 1;
        const btnId = `btn-${currentScreenNum}-${Date.now().toString().slice(-4)}`;
        
        // NaN 체크 및 기본값 설정
        x = isNaN(x) ? 0 : x;
        y = isNaN(y) ? 0 : y;
        width = isNaN(width) ? 75 : width;
        height = isNaN(height) ? 57 : height;
        
        return `{
    id: '${btnId}',
    x: ${x},
    y: ${y},
    width: ${width},
    height: ${height},
    action: () => goToScreen(${nextScreen}),
    useLeftTopPosition: true
}`;
    }
    
    // 공통 버튼 코드 생성 함수
    function generateCommonButtonCode(name, x, y, width, height, targetScreen, startScreen, endScreen) {
        return `// 1. buttons-config.json 파일의 commonButtons 객체에 추가:
{
  "commonButtons": {
    "${name}": {
      "id": "btn-${name}",
      "x": ${x},
      "y": ${y},
      "width": ${width},
      "height": ${height},
      "targetScreen": ${targetScreen},
      "useLeftTopPosition": true
    }
  },
  "buttonRanges": [
    {
      "buttonId": "${name}",
      "startScreen": ${startScreen},
      "endScreen": ${endScreen}
    }
  ]
}`;
    }
    
    console.log('개발 모드 사용 방법:');
    console.log('1. 패널은 상단 바를 드래그하여 이동할 수 있습니다');
    console.log('2. "영역 생성" 버튼을 클릭하고 드래그하여 영역을 선택하세요');
    console.log('3. 생성된 코드를 "JSON에 저장" 버튼으로 설정 파일에 저장할 수 있습니다');
    console.log('4. 공통 버튼을 만들려면 하단의 공통 버튼 도구를 사용하세요');
}

// 전역에 개발 모드 함수 노출
window.enableDevMode = enableDevMode; 