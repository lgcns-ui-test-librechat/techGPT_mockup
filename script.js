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
        // const screenIndicator = document.createElement('div');
        // screenIndicator.className = 'screen-indicator';
        // screenIndicator.textContent = `${currentScreenNum} / ${totalScreens}`;
        // document.body.appendChild(screenIndicator);
        
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
            
            // 버튼 오버레이 즉시 업데이트 (setTimeout 제거)
            updateButtonOverlay();
            
            // 디버깅용 정보 출력
            const rect = currentScreen.getBoundingClientRect();
            console.log(`이미지 실제 크기: ${rect.width}x${rect.height}`);
            
            const containerRect = screenContainer.getBoundingClientRect();
            console.log(`컨테이너 크기: ${containerRect.width}x${containerRect.height}`);
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
        
        // 즉시 기존 버튼 제거 (화면 전환 전)
        buttonOverlay.innerHTML = '';
        buttonOverlay.style.width = '0';
        buttonOverlay.style.height = '0';
        
        // 화면 번호와 이미지 업데이트
        currentScreenNum = screenNum;
        currentScreen.src = `screenshot/${screenNum}.PNG`;
        
        // 인디케이터 업데이트
        // const screenIndicator = document.querySelector('.screen-indicator');
        // if (screenIndicator) {
        //     screenIndicator.textContent = `${screenNum} / ${totalScreens}`;
        // }
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
        
        // 처리 시작 기록
        const startTime = performance.now();
        
        // 기존 버튼들 즉시 제거
        buttonOverlay.innerHTML = '';
        
        // 현재 화면에 매핑된 버튼 데이터 가져오기
        const mappings = window.screenMappings[currentScreenNum] || [];
        
        // 버튼이 없으면 빠르게 종료
        if (mappings.length === 0) {
            console.log(`화면 ${currentScreenNum}에 버튼이 없습니다.`);
            return;
        }
        
        // 버튼 오버레이 크기를 이미지에 맞게 조정
        const containerRect = screenContainer.getBoundingClientRect();
        buttonOverlay.style.width = `${containerRect.width}px`;
        buttonOverlay.style.height = `${containerRect.height}px`;
        
        // 개발 모드 상태 확인
        const isDevMode = document.body.classList.contains('dev-mode');
        
        // 성능 최적화를 위한 DocumentFragment 사용
        const fragment = document.createDocumentFragment();
        
        // 현재 이미지의 실제 치수 가져오기
        const imgRect = currentScreen.getBoundingClientRect();
        
        // 모든 버튼 영역 생성 및 속성 설정
        mappings.forEach(mapping => {
            const area = document.createElement('div');
            area.id = mapping.id;
            area.className = 'clickable-area';
            
            // 좌표 확인 - 매우 작은 값(1 이하)은 유효하지 않은 것으로 간주
            // x, y는 0이 유효할 수 있으므로 NaN만 체크
            const validX = !isNaN(mapping.x) ? mapping.x : 0;
            const validY = !isNaN(mapping.y) ? mapping.y : 0;
            
            // width, height는 반드시 1보다 커야 함
            // 0 또는 음수일 경우에만 기본값 적용
            const validWidth = (!isNaN(mapping.width) && mapping.width > 0) ? mapping.width : 50;
            const validHeight = (!isNaN(mapping.height) && mapping.height > 0) ? mapping.height : 50;
            
            // 디버깅 - 기본값이 적용되는지 확인
            if (mapping.width <= 0 || isNaN(mapping.width) || mapping.height <= 0 || isNaN(mapping.height)) {
                console.warn(`버튼 '${mapping.id}'에 기본 크기가 적용됨 - 원본 값:`, 
                    {x: mapping.x, y: mapping.y, width: mapping.width, height: mapping.height},
                    '적용된 값:', {x: validX, y: validY, width: validWidth, height: validHeight});
            }
            
            // 현재 스케일에 맞게 크기 조정
            const width = validWidth * scaleRatio;
            const height = validHeight * scaleRatio;
            
            // 위치 계산
            let left, top;
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
            area.style.cssText = `
                position: absolute !important;
                left: ${left}px !important;
                top: ${top}px !important;
                width: ${width}px !important;
                height: ${height}px !important;
                z-index: 100 !important;
                cursor: pointer !important;
                pointer-events: auto !important;
                ${isDevMode ? 'background-color: rgba(255, 0, 0, 0.3) !important; border: 2px dashed red !important;' : 'background-color: transparent; border: none;'}
            `;
            
            // 디버깅용 정보 저장 (원본 좌표 유지)
            area.dataset.originalCoords = JSON.stringify({x: validX, y: validY, width: validWidth, height: validHeight});
            
            // 클릭 이벤트 연결
            area.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();  // 이벤트 버블링 방지
                mapping.action();
            });
            
            // DocumentFragment에 추가 (DOM에 바로 추가하지 않음)
            fragment.appendChild(area);
        });
        
        // 한 번에 DOM에 추가 (성능 최적화)
        buttonOverlay.appendChild(fragment);
        
        // 처리 시간 측정
        const endTime = performance.now();
        console.log(`버튼 오버레이 업데이트 완료: ${mappings.length}개 버튼, ${Math.round(endTime - startTime)}ms 소요`);
    }
    
    // 특정 요소의 시각화 토글 헬퍼 함수 (최적화 버전)
    function toggleElementVisibility(element, isVisible) {
        if (!element) return;
        
        // 기존 위치와 크기 정보 유지
        const left = element.style.left;
        const top = element.style.top;
        const width = element.style.width;
        const height = element.style.height;
        
        // 데이터 속성 설정 (CSS 선택자를 위해)
        if (isVisible) {
            element.setAttribute('data-visible', 'true');
        } else {
            element.removeAttribute('data-visible');
        }
        
        // 인라인 스타일 한 번에 적용 (reflow 최소화)
        element.style.cssText = `
            position: absolute !important;
            left: ${left} !important;
            top: ${top} !important;
            width: ${width} !important;
            height: ${height} !important;
            background-color: ${isVisible ? 'rgba(255, 0, 0, 0.3) !important' : 'transparent'};
            border: ${isVisible ? '2px dashed red !important' : 'none'};
            z-index: ${isVisible ? '1000 !important' : '100'};
            cursor: pointer !important;
            pointer-events: auto !important;
        `;
    }
    
    // 버튼 시각화 토글 함수 (최적화 버전)
    function toggleButtonVisibility(isVisible) {
        // 가능한 빠르게 처리하기 위해 현재 생성된 모든 버튼 선택
        const areas = document.querySelectorAll('.clickable-area');
        if (areas.length === 0) return;
        
        // 모든 버튼 스타일 일괄 업데이트 (성능 최적화)
        areas.forEach(area => {
            // 현재 위치와 크기 정보
            const left = area.style.left;
            const top = area.style.top;
            const width = area.style.width;
            const height = area.style.height;
            
            // CSS 클래스 전환 대신 인라인 스타일 직접 적용 (더 빠름)
            area.style.cssText = `
                position: absolute !important;
                left: ${left} !important;
                top: ${top} !important;
                width: ${width} !important;
                height: ${height} !important;
                background-color: ${isVisible ? 'rgba(255, 0, 0, 0.3) !important' : 'transparent'};
                border: ${isVisible ? '2px dashed red !important' : 'none'};
                z-index: ${isVisible ? '1000 !important' : '100'};
                cursor: pointer !important;
                pointer-events: auto !important;
            `;
            
            // 데이터 속성도 업데이트
            if (isVisible) {
                area.setAttribute('data-visible', 'true');
            } else {
                area.removeAttribute('data-visible');
            }
        });
        
        console.log(`${areas.length}개 버튼 영역 ${isVisible ? '표시' : '숨김'} 처리 완료`);
    }
    
    // 전역 객체에 함수 노출
    window.goToScreen = goToScreen;
    window.getCurrentScreenNum = () => currentScreenNum;
    window.updateButtons = updateButtonOverlay;
    window.toggleButtonVisibility = toggleButtonVisibility;
}); 