document.addEventListener('DOMContentLoaded', function() {
    // 필요한 요소 가져오기
    const screenContainer = document.getElementById('screen-container');
    const currentScreen = document.getElementById('current-screen');
    const buttonOverlay = document.getElementById('button-overlay');
    
    let config = null; // 이미지 설정 객체
    let buttonsConfig = null; // 버튼 설정 객체
    let currentScreenNum = 4; // 시작 화면 번호
    const totalScreens = 17;
    let scaleRatio = 1; // 현재 스케일 비율
    
    // Promise.all을 사용하여 모든 설정 파일을 병렬로 로드
    Promise.all([
        fetch('config/image-config.json').then(response => response.json()),
        fetch('config/buttons-config.json').then(response => response.json())
    ])
        .then(([imageConfig, btnConfig]) => {
            config = imageConfig;
            buttonsConfig = btnConfig;
            initializeApp();
        })
        .catch(err => {
            console.error('설정 파일을 불러오는 데 실패했습니다:', err);
            // 기본값으로 초기화
            config = {
                imageWidth: 2498,
                imageHeight: 1440
            };
            buttonsConfig = {
                commonButtons: {},
                screenMappings: {},
                buttonRanges: []
            };
            initializeApp();
        });
    
    // 앱 초기화 함수
    function initializeApp() {
        // 원본 이미지 비율 계산
        const aspectRatio = config.imageWidth / config.imageHeight;
        
        // 이미지 비율 유지 설정
        currentScreen.style.aspectRatio = `${aspectRatio}`;
        
        // 스크린 인디케이터 추가
        const screenIndicator = document.createElement('div');
        screenIndicator.className = 'screen-indicator';
        screenIndicator.textContent = `${currentScreenNum} / ${totalScreens}`;
        document.body.appendChild(screenIndicator);
        
        // 창 크기에 맞게 이미지 컨테이너 조정
        adjustContainerScale();
        
        // 공통 버튼 정의
        setupCommonButtons();
        
        // 이벤트 리스너 등록
        setupEventListeners();
        
        // 초기 화면 설정
        updateButtonOverlay();
    }
    
    // 공통 버튼 정의 함수
    function setupCommonButtons() {
        // JSON에서 가져온 버튼 설정 사용
        const commonButtons = {};
        
        // 함수와 함께 공통 버튼 생성
        if (buttonsConfig && buttonsConfig.commonButtons) {
            Object.keys(buttonsConfig.commonButtons).forEach(key => {
                const btnData = buttonsConfig.commonButtons[key];
                
                // 버튼 객체 생성
                commonButtons[key] = {
                    id: btnData.id,
                    x: btnData.x,
                    y: btnData.y,
                    width: btnData.width,
                    height: btnData.height,
                    action: () => goToScreen(btnData.targetScreen),
                    useLeftTopPosition: btnData.useLeftTopPosition
                };
            });
        }
        
        window.commonButtons = commonButtons;
        
        // JSON에서 화면별 버튼 매핑 추출
        const screenMappings = {};
        
        // 화면별 버튼 매핑 처리
        if (buttonsConfig && buttonsConfig.screenMappings) {
            Object.keys(buttonsConfig.screenMappings).forEach(screenNum => {
                const screenButtons = buttonsConfig.screenMappings[screenNum];
                screenMappings[screenNum] = screenButtons.map(btnData => ({
                    id: btnData.id,
                    x: btnData.x,
                    y: btnData.y,
                    width: btnData.width,
                    height: btnData.height,
                    action: () => goToScreen(btnData.targetScreen),
                    useLeftTopPosition: btnData.useLeftTopPosition
                }));
            });
        }
        
        window.screenMappings = screenMappings;
        
        // 공통 버튼 여러 화면에 추가
        if (buttonsConfig && buttonsConfig.buttonRanges) {
            buttonsConfig.buttonRanges.forEach(range => {
                const buttonKey = range.buttonId;
                const button = commonButtons[buttonKey];
                if (button) {
                    addButtonToScreenRange(button, range.startScreen, range.endScreen);
                }
            });
        }
    }
    
    // 이벤트 리스너 설정
    function setupEventListeners() {
        // 이미지 로드 완료 시 버튼 오버레이 초기화
        currentScreen.addEventListener('load', function() {
            console.log('이미지 로드 이벤트 발생');
            
            // 컨테이너 스케일 먼저 조정
            adjustContainerScale();
            
            // 약간의 지연 후 버튼 오버레이 업데이트
            setTimeout(function() {
                updateButtonOverlay();
                
                // 디버깅용 정보 출력
                const rect = currentScreen.getBoundingClientRect();
                console.log(`이미지 실제 크기: ${rect.width}x${rect.height}`);
                
                const containerRect = screenContainer.getBoundingClientRect();
                console.log(`컨테이너 크기: ${containerRect.width}x${containerRect.height}`);
            }, 100);
        });
        
        // 윈도우 크기 변경 시 컨테이너 스케일 조정
        window.addEventListener('resize', function() {
            // 디바운싱 처리로 성능 향상
            if (window.resizeTimer) clearTimeout(window.resizeTimer);
            window.resizeTimer = setTimeout(function() {
                console.log('화면 크기 변경 감지');
                adjustContainerScale();
                updateButtonOverlay();
            }, 100);
        });
    }
    
    // 지정된 여러 화면에 동일한 버튼 추가 함수
    function addButtonToScreens(buttonConfig, screenNumbers) {
        screenNumbers.forEach(num => {
            if (!window.screenMappings[num]) {
                window.screenMappings[num] = [];
            }
            
            // 버튼 설정 복사 (중요: 깊은 복사가 필요)
            const buttonCopy = JSON.parse(JSON.stringify(buttonConfig));
            
            // ID 유니크하게 설정
            buttonCopy.id = `${buttonConfig.id}-screen${num}`;
            
            // action 함수 처리 (JSON.stringify로 함수는 직렬화되지 않음)
            buttonCopy.action = buttonConfig.action;
            buttonCopy.useLeftTopPosition = buttonConfig.useLeftTopPosition;
            
            // 해당 화면에 버튼 추가
            window.screenMappings[num].push(buttonCopy);
        });
    }
    
    // 특정 범위의 화면에 버튼 추가 도우미 함수
    function addButtonToScreenRange(buttonConfig, startScreen, endScreen) {
        const screens = Array.from(
            { length: endScreen - startScreen + 1 }, 
            (_, i) => startScreen + i
        );
        addButtonToScreens(buttonConfig, screens);
    }
    
    // 화면 전환 함수
    function goToScreen(screenNum) {
        if (screenNum < 1 || screenNum > totalScreens) return;
        
        console.log(`화면 ${currentScreenNum}에서 ${screenNum}으로 이동합니다.`);
        currentScreenNum = screenNum;
        currentScreen.src = `screenshot/${screenNum}.PNG`;
        
        // 인디케이터 업데이트
        const screenIndicator = document.querySelector('.screen-indicator');
        if (screenIndicator) {
            screenIndicator.textContent = `${screenNum} / ${totalScreens}`;
        }
    }
    
    // 컨테이너 스케일 조정 함수
    function adjustContainerScale() {
        if (!config) return;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 뷰포트 크기와 이미지 크기 비율 계산
        const scaleX = viewportWidth / config.imageWidth;
        const scaleY = viewportHeight / config.imageHeight;
        
        // 더 작은 비율 선택 (이미지가 화면에 완전히 표시되도록)
        scaleRatio = Math.min(scaleX, scaleY);
        
        // 이미지 실제 크기 계산
        const actualWidth = config.imageWidth * scaleRatio;
        const actualHeight = config.imageHeight * scaleRatio;
        
        // 스크린 컨테이너 크기 설정
        screenContainer.style.width = `${actualWidth}px`;
        screenContainer.style.height = `${actualHeight}px`;
        
        console.log(`화면 크기 조정: 스케일 비율 = ${scaleRatio}, 크기 = ${actualWidth}x${actualHeight}`);
    }
    
    // 버튼 오버레이 업데이트 함수
    function updateButtonOverlay() {
        if (!config) return;
        
        // 기존 버튼들 제거
        buttonOverlay.innerHTML = '';
        
        // 버튼 오버레이 크기를 이미지에 맞게 조정
        buttonOverlay.style.width = screenContainer.style.width;
        buttonOverlay.style.height = screenContainer.style.height;
        
        // 현재 화면에 맞는 클릭 영역 생성
        const mappings = window.screenMappings[currentScreenNum] || [];
        console.log(`화면 ${currentScreenNum}에 ${mappings.length}개의 버튼을 생성합니다.`);
        
        // 개발 모드 상태 확인
        const isDevMode = document.body.classList.contains('dev-mode');
        
        // 현재 이미지의 실제 치수 가져오기
        const imgRect = currentScreen.getBoundingClientRect();
        
        mappings.forEach(mapping => {
            const area = document.createElement('div');
            area.id = mapping.id;
            area.className = 'clickable-area';
            
            // 원본 이미지 기준 픽셀 위치를 현재 스케일에 맞게 조정
            let left, top, width, height;
            
            // 좌표가 유효한지 확인
            const validX = !isNaN(mapping.x) ? mapping.x : 0;
            const validY = !isNaN(mapping.y) ? mapping.y : 0;
            const validWidth = !isNaN(mapping.width) && mapping.width > 0 ? mapping.width : 75;
            const validHeight = !isNaN(mapping.height) && mapping.height > 0 ? mapping.height : 57;
            
            // 현재 스케일에 맞게 크기 조정
            width = validWidth * scaleRatio;
            height = validHeight * scaleRatio;
            
            if (mapping.useLeftTopPosition) {
                // 왼쪽 상단 기준 좌표
                left = validX * scaleRatio;
                top = validY * scaleRatio;
            } else {
                // 중앙 기준 좌표를 왼쪽 상단 기준으로 변환
                left = (validX - (validWidth / 2)) * scaleRatio;
                top = (validY - (validHeight / 2)) * scaleRatio;
            }
            
            // 절대 위치 설정 (픽셀 단위)
            area.style.position = 'absolute';
            area.style.left = `${left}px`;
            area.style.top = `${top}px`;
            area.style.width = `${width}px`;
            area.style.height = `${height}px`;
            
            // 디버깅용 정보 저장
            area.dataset.debug = `${mapping.id}: x=${validX}, y=${validY}, w=${validWidth}, h=${validHeight}`;
            area.dataset.originalCoords = JSON.stringify({x: validX, y: validY, width: validWidth, height: validHeight});
            
            // 개발 모드 시각화 적용 (v키 눌렀을 때)
            if (isDevMode) {
                toggleElementVisibility(area, true);
            }
            
            // 클릭 이벤트 연결
            area.addEventListener('click', function(e) {
                console.log(`${mapping.id} 버튼이 클릭되었습니다.`);
                console.log(`버튼 정보: x=${validX}, y=${validY}, width=${validWidth}, height=${validHeight}`);
                e.preventDefault();
                e.stopPropagation();  // 이벤트 버블링 방지
                mapping.action();
            });
            
            buttonOverlay.appendChild(area);
        });
        
        console.log(`오버레이 조정 완료: 스케일 = ${scaleRatio}, 이미지 크기 = ${Math.round(imgRect.width)}×${Math.round(imgRect.height)}px`);
    }
    
    // 특정 요소의 시각화 토글 헬퍼 함수
    function toggleElementVisibility(element, isVisible) {
        // 기존 스타일 저장 (위치와 크기 정보)
        const origLeft = element.style.left;
        const origTop = element.style.top;
        const origWidth = element.style.width;
        const origHeight = element.style.height;
        
        if (isVisible) {
            // 데이터 속성으로 표시 상태 설정 (CSS 선택자를 위해)
            element.setAttribute('data-visible', 'true');
            
            // 인라인 스타일로 시각화 설정 (CSS보다 우선 적용됨)
            element.style.cssText = `
                position: absolute;
                left: ${origLeft};
                top: ${origTop};
                width: ${origWidth};
                height: ${origHeight};
                background-color: rgba(255, 0, 0, 0.3);
                border: 2px dashed red;
                z-index: 1000;
                cursor: pointer;
                pointer-events: auto;
            `;
            
            // 디버깅 확인
            console.log(`버튼 표시: ${element.id}, 위치: ${origLeft}, ${origTop}`);
        } else {
            // 표시 상태 제거
            element.removeAttribute('data-visible');
            
            // 인라인 스타일로 투명/기본 상태로 복원
            element.style.cssText = `
                position: absolute;
                left: ${origLeft};
                top: ${origTop};
                width: ${origWidth};
                height: ${origHeight};
                background-color: transparent;
                border: none;
                z-index: 100;
                cursor: pointer;
                pointer-events: auto;
            `;
        }
    }
    
    // 버튼 시각화 토글 함수 추가
    function toggleButtonVisibility(isVisible) {
        // 현재 생성된 모든 버튼에 대해 시각화 처리
        const areas = document.querySelectorAll('.clickable-area');
        
        if (areas.length === 0) {
            console.log('표시할 버튼이 없습니다. 현재 화면: ' + currentScreenNum);
            return;
        }
        
        console.log(`'v' 키 눌림: ${isVisible ? '버튼 표시' : '버튼 숨김'} 모드, 버튼 개수: ${areas.length}`);
        
        // 모든 버튼에 대해 시각화 토글 적용
        areas.forEach(area => {
            toggleElementVisibility(area, isVisible);
        });
        
        // 디버깅용 정보 표시
        console.log(`${areas.length}개 버튼 영역 ${isVisible ? '표시됨' : '숨김'}`);
    }
    
    // 전역 객체에 함수 노출
    window.goToScreen = goToScreen;
    window.getCurrentScreenNum = () => currentScreenNum;
    window.updateButtons = updateButtonOverlay;
    window.toggleButtonVisibility = toggleButtonVisibility;
}); 