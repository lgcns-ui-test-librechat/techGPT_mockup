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
    
    // 버튼 시각화 초기화 (v키 눌림 효과)
    if (!document.body.classList.contains('dev-mode')) {
        console.log('개발자 모드에서 버튼 시각화 활성화');
        document.body.classList.add('dev-mode');
        
        // 버튼 시각화 적용
        if (typeof window.toggleButtonVisibility === 'function') {
            window.toggleButtonVisibility(true);
        }
    }
    
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
                <div id="image-coords-info"></div>
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
            z-index: 9000;
            box-sizing: border-box;
            min-width: 5px;
            min-height: 5px;
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
        #image-coords-info {
            margin-top: 5px;
            background: rgba(0, 0, 0, 0.3);
            padding: 5px;
            border-radius: 3px;
            font-size: 12px;
            font-family: monospace;
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
    
    // 필요한 요소 가져오기
    const createBtn = devPanel.querySelector('#create-area-btn');
    const coordsDisplay = devPanel.querySelector('#coords-display');
    const generatedCode = devPanel.querySelector('#generated-code');
    const copyCodeBtn = devPanel.querySelector('#copy-code-btn');
    const saveToJsonBtn = devPanel.querySelector('#save-to-json-btn');
    const imageInfoDisplay = devPanel.querySelector('#image-coords-info');
    
    // 이미지 영역 정보 표시
    function updateImageInfo() {
        const imgRect = currentScreen.getBoundingClientRect();
        const originalWidth = window.config ? window.config.imageWidth : 2498;
        const originalHeight = window.config ? window.config.imageHeight : 1440;
        
        // 이미지의 현재 크기, 원본 크기 및 비율 표시
        imageInfoDisplay.innerHTML = `
            [이미지 정보]
            현재: ${Math.round(imgRect.width)}×${Math.round(imgRect.height)}px
            원본: ${originalWidth}×${originalHeight}px
            비율: ${(imgRect.width / originalWidth).toFixed(3)}
        `;
    }
    
    // 페이지 로드 및 리사이즈 시 이미지 정보 업데이트
    updateImageInfo();
    window.addEventListener('resize', updateImageInfo);
    currentScreen.addEventListener('load', updateImageInfo);
    
    // 영역 생성 버튼 클릭 - 하나의 이벤트 리스너로 통합
    createBtn.addEventListener('click', function() {
        if (isSelecting) {
            // 선택 모드가 활성화된 상태에서 클릭: 선택 종료
            endSelection();
            this.textContent = '영역 생성';
            currentScreen.removeEventListener('mousedown', startSelection);
        } else {
            // 선택 모드가 비활성화된 상태에서 클릭: 선택 시작 준비
            coordsDisplay.innerHTML = '이미지에서 드래그하여 영역을 선택하세요';
            this.textContent = '선택 취소';
            
            // 기존 선택 박스가 있으면 제거
            if (selectionBox) {
                selectionBox.remove();
                selectionBox = null;
            }
            
            currentScreen.addEventListener('mousedown', startSelection);
        }
        
        console.log('영역 생성 버튼 클릭됨: ' + (isSelecting ? '선택 종료' : '선택 시작'));
    });
    
    // 최소화 버튼
    const minimizeBtn = devPanel.querySelector('#minimize-dev-panel');
    minimizeBtn.addEventListener('click', function() {
        devPanel.classList.toggle('minimized');
        this.textContent = devPanel.classList.contains('minimized') ? '□' : '_';
    });
    
    // 닫기 버튼
    const stopDevModeBtn = devPanel.querySelector('#stop-dev-mode');
    stopDevModeBtn.addEventListener('click', function() {
        // 선택 상자 제거
        if (selectionBox) {
            selectionBox.remove();
        }
        
        // 개발자 모드 UI 제거
        devPanel.remove();
        
        // 버튼 시각화 끄기
        document.body.classList.remove('dev-mode');
        if (typeof window.toggleButtonVisibility === 'function') {
            window.toggleButtonVisibility(false);
        }
        
        console.log('개발자 모드가 종료되었습니다.');
    });
    
    // 코드 복사 버튼
    copyCodeBtn.addEventListener('click', function() {
        generatedCode.select();
        document.execCommand('copy');
        alert('코드가 클립보드에 복사되었습니다!');
    });
    
    // JSON에 저장 버튼
    saveToJsonBtn.addEventListener('click', function() {
        let codeText;
        let codeObj;
        
        try {
            // 현재 코드 필드에서 코드 텍스트 가져오기
            codeText = generatedCode.value;
            
            // 비어있는지 확인
            if (!codeText.trim()) {
                throw new Error('생성된 코드가 없습니다. 먼저 영역을 선택하세요.');
            }
            
            // 코드 텍스트를 JavaScript 객체로 변환
            codeObj = Function(`return ${codeText}`)();
            
            // 필수 속성 확인
            if (!codeObj.id || typeof codeObj.x === 'undefined' || 
                typeof codeObj.y === 'undefined' || 
                typeof codeObj.width === 'undefined' || 
                typeof codeObj.height === 'undefined') {
                throw new Error('생성된 코드가 필수 속성을 포함하고 있지 않습니다.');
            }
            
            // 값 유효성 확인 및 보정
            if (isNaN(codeObj.width) || codeObj.width <= 0) {
                console.warn('유효하지 않은 너비:', codeObj.width);
                codeObj.width = 50; // 더 작은 기본값 사용
            }
            
            if (isNaN(codeObj.height) || codeObj.height <= 0) {
                console.warn('유효하지 않은 높이:', codeObj.height);
                codeObj.height = 50; // 더 작은 기본값 사용
            }
            
            console.log('저장할 버튼 데이터:', codeObj);
            
            // 버튼 설정 객체 생성
            const buttonConfig = {
                id: codeObj.id,
                x: codeObj.x,
                y: codeObj.y,
                width: codeObj.width,
                height: codeObj.height,
                targetScreen: codeObj.action ? Number(codeObj.action.toString().match(/goToScreen\((\d+)\)/)[1]) : currentScreenNum + 1,
                useLeftTopPosition: true
            };
            
            // 값 로깅
            console.log('최종 버튼 설정 데이터 확인:', buttonConfig);
            
            // screenMappings에 추가
            if (!window.screenMappings[currentScreenNum]) {
                window.screenMappings[currentScreenNum] = [];
            }
            
            // 설정 복사 및 추가
            const configObj = {
                screenMappings: {}
            };
            
            configObj.screenMappings[currentScreenNum] = [];
            configObj.screenMappings[currentScreenNum].push(buttonConfig);
            
            console.log('저장할 버튼 설정:', configObj);
            
            // 파일 다운로드 링크 생성
            const jsonString = JSON.stringify(configObj, null, 2);
            const fileName = `button-config-screen${currentScreenNum}-${Date.now().toString().slice(-4)}.json`;
            
            const downloadLink = document.createElement('a');
            downloadLink.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonString);
            downloadLink.download = fileName;
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // 버튼 추가 및 업데이트
            window.screenMappings[currentScreenNum].push({
                id: codeObj.id,
                x: codeObj.x,
                y: codeObj.y,
                width: codeObj.width,
                height: codeObj.height,
                action: () => window.goToScreen(buttonConfig.targetScreen),
                useLeftTopPosition: true
            });
            
            // 화면 업데이트
            if (typeof window.updateButtonOverlay === 'function') {
                window.updateButtonOverlay();
            }
            
            console.log(`JSON 설정이 다운로드되었습니다. (${fileName})`);
            alert(`버튼이 추가되었습니다! 크기: ${buttonConfig.width}×${buttonConfig.height}px\n설정 파일이 다운로드됩니다.`);
            
        } catch (err) {
            console.error('JSON 생성 오류:', err);
            alert('오류: ' + err.message);
        }
    });
    
    // 현재 이미지에 클릭 이벤트 리스너 추가
    currentScreen.addEventListener('click', function(e) {
        if (!isSelecting) {
            // 이미지 좌표 확인만 하는 경우
            const imgRect = currentScreen.getBoundingClientRect();
            
            // 이미지 내 클릭 좌표 (CSS 픽셀)
            const clickXInImage = e.clientX - imgRect.left;
            const clickYInImage = e.clientY - imgRect.top;
            
            // 사용자 지정 버튼 크기 (최소 크기 보장)
            const userWidth = 50;  // 사용자 정의 가능 - 더 작은 기본 크기
            const userHeight = 50; // 사용자 정의 가능 - 더 작은 기본 크기
            
            // 좌표 표시 (픽셀값 그대로 사용)
            coordsDisplay.innerHTML = `
                클릭 위치:<br>
                화면 기준: ${Math.round(e.clientX)}, ${Math.round(e.clientY)}<br>
                이미지 내: ${Math.round(clickXInImage)}, ${Math.round(clickYInImage)}<br>
                생성될 버튼 크기: ${userWidth}×${userHeight}
            `;
            
            console.log('클릭 - 화면:', e.clientX, e.clientY);
            console.log('클릭 - 이미지 내(실제 픽셀값):', clickXInImage, clickYInImage);
            
            // 픽셀 좌표 그대로 사용하여 코드 생성 (사용자 지정 크기)
            generatedCode.value = generateCode(Math.round(clickXInImage), Math.round(clickYInImage), userWidth, userHeight);
        }
    });
    
    // 영역 선택 시작
    function startSelection(e) {
        e.preventDefault();
        
        try {
            // 선택 모드 활성화
            isSelecting = true;
            
            // 이미지의 실제 크기와 위치 가져오기
            const imgRect = currentScreen.getBoundingClientRect();
            
            // 시작 좌표 (화면 기준)
            startX = e.clientX;
            startY = e.clientY;
            
            // 이미지 내 클릭 위치 (CSS 픽셀)
            const clickXWithinImage = e.clientX - imgRect.left;
            const clickYWithinImage = e.clientY - imgRect.top;
            
            // 시작 위치 저장 (픽셀 값 그대로 사용)
            areaStartX = Math.round(clickXWithinImage);
            areaStartY = Math.round(clickYWithinImage);
            
            console.log('이미지 크기 및 위치:', imgRect.width, imgRect.height, imgRect.left, imgRect.top);
            console.log('선택 시작 - 이미지 내 위치(실제 픽셀값):', areaStartX, areaStartY);
            
            // 기존 선택 박스가 있으면 제거
            if (selectionBox) {
                selectionBox.remove();
            }
            
            // 선택 박스 생성
            selectionBox = document.createElement('div');
            selectionBox.className = 'selection-box';
            buttonOverlay.appendChild(selectionBox);
            
            // 마우스 이벤트 연결
            document.addEventListener('mousemove', updateSelection);
            document.addEventListener('mouseup', endSelection);
            
            // 초기 선택 박스 크기 설정 (1x1 픽셀)
            selectionBox.style.left = `${areaStartX}px`;
            selectionBox.style.top = `${areaStartY}px`;
            selectionBox.style.width = '1px';
            selectionBox.style.height = '1px';
            
            // 초기 데이터 속성 설정
            selectionBox.dataset.finalX = areaStartX;
            selectionBox.dataset.finalY = areaStartY;
            selectionBox.dataset.finalWidth = 1;
            selectionBox.dataset.finalHeight = 1;
        } catch (err) {
            console.error('startSelection 오류:', err);
            endSelection(); // 오류 발생 시 선택 종료
        }
    }
    
    // 영역 선택 업데이트
    function updateSelection(e) {
        if (!isSelecting) return;
        
        try {
            // 이미지의 실제 크기와 위치 가져오기
            const imgRect = currentScreen.getBoundingClientRect();
            
            // 이미지가 로드되지 않았거나 크기가 없는 경우 처리
            if (!imgRect.width || !imgRect.height) {
                console.error('이미지 크기를 가져올 수 없습니다');
                return;
            }
            
            const currentX = e.clientX;
            const currentY = e.clientY;
            
            // 이미지 영역 내로 좌표 제한
            const clampedStartX = Math.max(imgRect.left, Math.min(imgRect.right, startX));
            const clampedStartY = Math.max(imgRect.top, Math.min(imgRect.bottom, startY));
            const clampedCurrentX = Math.max(imgRect.left, Math.min(imgRect.right, currentX));
            const clampedCurrentY = Math.max(imgRect.top, Math.min(imgRect.bottom, currentY));
            
            // 이미지 내 상대 좌표 계산
            const startXInImage = clampedStartX - imgRect.left;
            const startYInImage = clampedStartY - imgRect.top;
            const currentXInImage = clampedCurrentX - imgRect.left;
            const currentYInImage = clampedCurrentY - imgRect.top;
            
            // 왼쪽 상단, 오른쪽 하단 좌표 결정 (방향 무관)
            const boxLeft = Math.min(startXInImage, currentXInImage);
            const boxTop = Math.min(startYInImage, currentYInImage);
            const boxRight = Math.max(startXInImage, currentXInImage);
            const boxBottom = Math.max(startYInImage, currentYInImage);
            
            // 크기 계산
            const minCssSize = 5;
            const width = Math.max(minCssSize, boxRight - boxLeft);
            const height = Math.max(minCssSize, boxBottom - boxTop);
            
            // 선택 박스가 있는지 확인
            if (selectionBox) {
                // 선택 박스 업데이트 (버튼 오버레이 기준)
                selectionBox.style.left = `${boxLeft}px`;
                selectionBox.style.top = `${boxTop}px`;
                selectionBox.style.width = `${width}px`;
                selectionBox.style.height = `${height}px`;
                
                // 정수로 변환
                const finalX = Math.round(boxLeft);
                const finalY = Math.round(boxTop);
                const finalWidth = Math.round(width);
                const finalHeight = Math.round(height);
                
                // 최종 좌표를 선택 박스에 데이터 속성으로 저장
                selectionBox.dataset.finalX = finalX;
                selectionBox.dataset.finalY = finalY;
                selectionBox.dataset.finalWidth = finalWidth;
                selectionBox.dataset.finalHeight = finalHeight;
                
                // 디버깅 정보
                console.log('영역 선택 중 - 이미지 내 위치(실제 픽셀값):', finalX, finalY, finalWidth, finalHeight);
                
                // 좌표 정보 업데이트
                coordsDisplay.innerHTML = `
                    선택 영역 (실제 픽셀값):<br>
                    좌상단: x=${finalX}, y=${finalY}<br>
                    크기: width=${finalWidth}, height=${finalHeight}
                `;
                
                // 코드 생성
                generatedCode.value = generateCode(finalX, finalY, finalWidth, finalHeight);
            } else {
                console.error('선택 박스가 없습니다');
            }
        } catch (err) {
            console.error('updateSelection 오류:', err);
        }
    }
    
    // 영역 선택 완료
    function endSelection() {
        console.log('endSelection 함수 호출됨, isSelecting:', isSelecting);
        
        // 이벤트 리스너 제거 (항상 제거하여 중복 호출 방지)
        document.removeEventListener('mousemove', updateSelection);
        document.removeEventListener('mouseup', endSelection);
        
        if (!isSelecting) return;
        
        // 선택 모드 해제
        isSelecting = false;
        
        // 선택 버튼 텍스트 복원
        if (createBtn) {
            createBtn.textContent = '영역 생성';
        }
        
        // 최종 선택 영역 좌표 처리
        if (selectionBox) {
            try {
                // 데이터 속성 값 확인
                let dataX = parseInt(selectionBox.dataset.finalX);
                let dataY = parseInt(selectionBox.dataset.finalY);
                let dataWidth = parseInt(selectionBox.dataset.finalWidth);
                let dataHeight = parseInt(selectionBox.dataset.finalHeight);
                
                console.log('데이터 속성 저장 좌표(실제 픽셀값):', {dataX, dataY, dataWidth, dataHeight});
                
                // NaN 체크 및 기본값 적용
                if (isNaN(dataX)) dataX = 0;
                if (isNaN(dataY)) dataY = 0;
                if (isNaN(dataWidth) || dataWidth <= 0) dataWidth = 50; // 더 작은 기본값
                if (isNaN(dataHeight) || dataHeight <= 0) dataHeight = 50; // 더 작은 기본값
                
                // 음수 너비/높이 처리 (방향이 반대인 경우)
                if (dataWidth < 0) {
                    dataX += dataWidth;
                    dataWidth = Math.abs(dataWidth);
                }
                if (dataHeight < 0) {
                    dataY += dataHeight;
                    dataHeight = Math.abs(dataHeight);
                }
                
                // 선택 영역 시각화 (스타일만 변경)
                const originalStyle = selectionBox.style.cssText;
                selectionBox.style.cssText = originalStyle + '; background-color: rgba(0, 255, 0, 0.3); border: 2px solid lime;';
                
                // 최종 좌표를 다시 데이터 속성에 저장
                selectionBox.dataset.finalX = dataX;
                selectionBox.dataset.finalY = dataY;
                selectionBox.dataset.finalWidth = dataWidth;
                selectionBox.dataset.finalHeight = dataHeight;
                
                // 좌표 정보 업데이트
                coordsDisplay.innerHTML = `
                    선택 영역 (실제 픽셀값):<br>
                    좌상단: x=${dataX}, y=${dataY}<br>
                    크기: width=${dataWidth}, height=${dataHeight}
                    <br><strong>영역 선택 완료!</strong>
                `;
                
                // 최종 코드 생성
                generatedCode.value = generateCode(dataX, dataY, dataWidth, dataHeight);
                
                console.log('영역 선택 완료 - 최종 좌표(실제 픽셀값):', {dataX, dataY, dataWidth, dataHeight});
            } catch (err) {
                console.error('영역 선택 완료 처리 중 오류:', err);
                
                // 오류 발생해도 기본 정보 표시
                coordsDisplay.innerHTML = `
                    <span style="color: yellow;">좌표 계산 중 오류가 발생했습니다.</span><br>
                    <strong>영역 선택 완료!</strong>
                `;
                
                // 기본 코드 생성
                generatedCode.value = generateCode(0, 0, 50, 50);
            }
        } else {
            console.log('영역 선택 완료 (선택 박스 없음)');
            coordsDisplay.innerHTML = `<span style="color: yellow;">선택 박스를 찾을 수 없습니다.</span><br><strong>영역 선택 완료!</strong>`;
            
            // 기본 코드 생성
            generatedCode.value = generateCode(0, 0, 50, 50);
        }
        
        // 영역 생성 버튼의 이벤트 리스너 갱신
        currentScreen.removeEventListener('mousedown', startSelection);
    }
    
    // 코드 생성 함수
    function generateCode(x, y, width, height) {
        const nextScreen = currentScreenNum + 1;
        const btnId = `btn-${currentScreenNum}-${Date.now().toString().slice(-4)}`;
        
        // 값 유효성 검사 - 0이나 정상값은 그대로 사용하고 undefined/NaN만 기본값으로 대체
        if (x === undefined || isNaN(x)) x = 0;
        if (y === undefined || isNaN(y)) y = 0;
        if (width === undefined || isNaN(width) || width <= 0) width = 50; // 더 작은 기본값
        if (height === undefined || isNaN(height) || height <= 0) height = 50; // 더 작은 기본값
        
        // 로그로 확인 (실제 픽셀값 그대로 사용)
        console.log('코드 생성 함수에 전달된 값(실제 픽셀값):', {x, y, width, height});
        
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
    
    // 공통 버튼 도구 관련 이벤트 처리
    const commonBtnName = devPanel.querySelector('#common-btn-name');
    const screenRangeStart = devPanel.querySelector('#screen-range-start');
    const screenRangeEnd = devPanel.querySelector('#screen-range-end');
    const targetScreen = devPanel.querySelector('#target-screen');
    const createCommonBtn = devPanel.querySelector('#create-common-btn');
    const applyCommonBtn = devPanel.querySelector('#apply-common-btn');
    const commonButtonCode = devPanel.querySelector('#common-button-code');
    const saveCommonToJsonBtn = devPanel.querySelector('#save-common-to-json-btn');
    
    // 공통 버튼 생성
    createCommonBtn.addEventListener('click', function() {
        const name = commonBtnName.value;
        if (!name) {
            alert('버튼 이름을 입력하세요.');
            return;
        }
        
        // 선택 영역이 있는 경우 해당 영역 사용, 없으면 기본값
        let x, y, width, height;
        
        if (selectionBox) {
            // 선택 박스에 저장된 최종 좌표 데이터 사용
            if (selectionBox.dataset.finalX && selectionBox.dataset.finalY && 
                selectionBox.dataset.finalWidth && selectionBox.dataset.finalHeight) {
                // 데이터 속성에서 최종 값 가져오기
                x = parseInt(selectionBox.dataset.finalX);
                y = parseInt(selectionBox.dataset.finalY);
                width = parseInt(selectionBox.dataset.finalWidth);
                height = parseInt(selectionBox.dataset.finalHeight);
                
                console.log('공통 버튼 생성: 데이터 속성 사용(실제 픽셀값)', x, y, width, height);
            } else {
                // 선택 박스 위치 및 크기
                const selRect = selectionBox.getBoundingClientRect();
                const imgRect = currentScreen.getBoundingClientRect();
                
                // 이미지 내 좌표로 변환
                const selLeftInImage = selRect.left - imgRect.left;
                const selTopInImage = selRect.top - imgRect.top;
                
                // 픽셀 값 그대로 사용
                x = Math.round(selLeftInImage);
                y = Math.round(selTopInImage);
                width = Math.round(selRect.width);
                height = Math.round(selRect.height);
                
                console.log('공통 버튼 생성: 계산된 좌표 사용(실제 픽셀값)', x, y, width, height);
            }
        } else {
            // 기본 위치 및 크기
            x = 0;
            y = 0;
            width = 75;
            height = 57;
            console.log('공통 버튼 생성: 기본값 사용', x, y, width, height);
        }
        
        const start = parseInt(screenRangeStart.value);
        const end = parseInt(screenRangeEnd.value);
        const target = parseInt(targetScreen.value);
        
        // 코드 생성
        commonButtonCode.value = generateCommonButtonCode(
            name, x, y, width, height, target, start, end
        );
    });
    
    // 공통 버튼 JSON 저장
    saveCommonToJsonBtn.addEventListener('click', function() {
        const buttonName = commonBtnName.value;
        if (!buttonName) {
            alert('버튼 이름을 입력하세요.');
            return;
        }
        
        const startScreen = parseInt(screenRangeStart.value);
        const endScreen = parseInt(screenRangeEnd.value);
        
        // 공통 버튼 설정 생성
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
    
    console.log('개발 모드 사용 방법:');
    console.log('1. 패널은 상단 바를 드래그하여 이동할 수 있습니다');
    console.log('2. "영역 생성" 버튼을 클릭하고 드래그하여 영역을 선택하세요');
    console.log('3. 생성된 코드를 "JSON에 저장" 버튼으로 설정 파일에 저장할 수 있습니다');
    console.log('4. 공통 버튼을 만들려면 하단의 공통 버튼 도구를 사용하세요');
}

// 전역에 개발 모드 함수 노출
window.enableDevMode = enableDevMode; 