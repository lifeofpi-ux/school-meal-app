// API 키 설정
const NEIS_API_KEY = '148e44ee66fe4d959d6ebe32b72a78ba';

// 급식 정보 조회를 위한 메인 함수
async function getMealInfo(schoolName, date) {
    try {
        // 학교 정보 조회
        const schoolInfo = await findSchool(schoolName);
        if (!schoolInfo) {
            return {
                error: "학교를 찾을 수 없습니다.",
                success: false
            };
        }

        // 급식 정보 조회
        const mealInfo = await fetchMealInfo(schoolInfo, date);
        if (!mealInfo) {
            return {
                error: "해당 날짜의 급식 정보를 찾을 수 없습니다.",
                success: false
            };
        }

        return {
            schoolName: schoolInfo.SCHUL_NM,
            date: mealInfo.MLSV_YMD,
            menu: mealInfo.DDISH_NM.split('<br/>'),
            calories: mealInfo.CAL_INFO,
            success: true
        };
    } catch (error) {
        return {
            error: "급식 정보를 가져오는 중 오류가 발생했습니다.",
            success: false
        };
    }
}

// 학교 정보 조회 함수
async function findSchool(name) {
    const url = "https://open.neis.go.kr/hub/schoolInfo";
    
    try {
        const response = await fetch(`${url}?KEY=${NEIS_API_KEY}&Type=json&SCHUL_NM=${encodeURIComponent(name)}`);
        const data = await response.json();
        
        if (data.schoolInfo && data.schoolInfo[1] && data.schoolInfo[1].row.length > 0) {
            return data.schoolInfo[1].row[0];
        }
        return null;
    } catch (error) {
        console.error('학교 정보 조회 중 오류:', error);
        return null;
    }
}

// 급식 정보 조회 함수
async function fetchMealInfo(schoolInfo, date) {
    const url = "https://open.neis.go.kr/hub/mealServiceDietInfo";
    
    try {
        const response = await fetch(
            `${url}?KEY=${NEIS_API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${schoolInfo.ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${schoolInfo.SD_SCHUL_CODE}&MLSV_YMD=${date}`
        );
        const data = await response.json();
        
        if (data.mealServiceDietInfo && data.mealServiceDietInfo[1] && data.mealServiceDietInfo[1].row.length > 0) {
            return data.mealServiceDietInfo[1].row[0];
        }
        return null;
    } catch (error) {
        console.error('급식 정보 조회 중 오류:', error);
        return null;
    }
}

// 저��된 학교 목록 가져오기
function getSavedSchools() {
    const savedSchools = localStorage.getItem('savedSchools');
    return savedSchools ? JSON.parse(savedSchools) : [];
}

// 학교 저장 함수
function saveSchool(schoolName) {
    if (!schoolName || schoolName.trim() === '') {
        return false;
    }

    const savedSchools = getSavedSchools();
    if (savedSchools.includes(schoolName.trim())) {
        return false;
    }

    savedSchools.push(schoolName.trim());
    localStorage.setItem('savedSchools', JSON.stringify(savedSchools));
    return true;
}

// 학교 삭제 함수
function deleteSchools(schoolsToDelete) {
    if (!schoolsToDelete || !Array.isArray(schoolsToDelete) || schoolsToDelete.length === 0) {
        return false;
    }

    let savedSchools = getSavedSchools();
    savedSchools = savedSchools.filter(school => !schoolsToDelete.includes(school));
    localStorage.setItem('savedSchools', JSON.stringify(savedSchools));
    return true;
}

// 급식 검색 함수
async function searchMeal(schoolName, date) {
    return await getMealInfo(schoolName, date);
}

function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

function navigateDay(direction) {
    const dateInput = document.getElementById('mealDate');
    const currentDate = new Date(dateInput.value);
    currentDate.setDate(currentDate.getDate() + direction);
    
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    
    dateInput.value = `${year}-${month}-${day}`;
    searchMealHandler(true);
}

function updateSchoolDropdown(schools) {
    const select = document.getElementById('schoolSelect');
    select.innerHTML = '<option value="">학교를 선택하세요</option>';
    
    schools.forEach(function(school) {
        const option = document.createElement('option');
        option.value = school;
        option.textContent = school;
        select.appendChild(option);
    });
}

function updateSchoolInput(value) {
    document.getElementById('schoolName').value = value;
}

function loadSavedSchools() {
    const schools = getSavedSchools();
    updateSchoolDropdown(schools);
    
    const listContainer = document.getElementById('savedSchoolsList');
    listContainer.innerHTML = '';
    
    schools.forEach(function(school, index) {
        const schoolItem = document.createElement('div');
        schoolItem.className = 'flex items-center bg-gray-50/50 p-3 rounded-lg hover:bg-gray-100/50 transition duration-200';
        schoolItem.innerHTML = `
            <input type="checkbox" class="mr-3 h-4 w-4 text-blue-600 rounded" id="school-${index}">
            <label for="school-${index}" class="flex-grow text-gray-700">${school}</label>
            <button onclick="selectSchool('${school}')" class="text-blue-500 hover:text-blue-700 p-1">
                <i class="ri-check-line"></i>
            </button>
        `;
        listContainer.appendChild(schoolItem);
    });
}

function openSettingsModal() {
    document.getElementById('settingsModal').classList.remove('hidden');
    document.getElementById('settingsModal').classList.add('flex');
    loadSavedSchools();
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.add('hidden');
    document.getElementById('settingsModal').classList.remove('flex');
}

function saveSchoolHandler() {
    const schoolName = document.getElementById('savedSchoolName').value.trim();
    
    if (schoolName) {
        showLoading();
        const result = saveSchool(schoolName);
        hideLoading();
        
        if (result) {
            alert('학교가 성공적으로 저장되었습니다.');
            document.getElementById('savedSchoolName').value = '';
            loadSavedSchools();
        } else {
            alert('이미 저장된 학교이거나 저장 중 문제가 발생했습니다.');
        }
    } else {
        alert('학교 이름을 입력해주세요.');
    }
}

function selectSchool(schoolName) {
    document.getElementById('schoolName').value = schoolName;
    document.getElementById('schoolSelect').value = schoolName;
    closeSettingsModal();
}

function deleteSelectedSchool() {
    const checkboxes = document.querySelectorAll('#savedSchoolsList input[type="checkbox"]:checked');
    const schoolsToDelete = Array.from(checkboxes).map(function(checkbox) {
        return checkbox.nextElementSibling.textContent;
    });

    if (schoolsToDelete.length > 0) {
        showLoading();
        const result = deleteSchools(schoolsToDelete);
        hideLoading();
        
        if (result) {
            alert('선택된 학교들이 삭제되었습니다.');
            loadSavedSchools();
        } else {
            alert('삭제 중 문제가 발생했습니다.');
        }
    } else {
        alert('삭제할 학교를 선택해주세요.');
    }
}

// 최근 조회한 학교 저장
function saveRecentSchool(schoolName) {
    if (!schoolName) return;
    localStorage.setItem('recentSchool', schoolName);
}

// 최근 조회한 학교 불러오기
function getRecentSchool() {
    return localStorage.getItem('recentSchool');
}

// 페이지 로드 시 초기화 함수 수정
window.onload = async function() {
    // 오늘 날짜로 초기화 (시간대 고려)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    // YYYY-MM-DD 형식으로 날짜 설정
    document.getElementById('mealDate').value = `${year}-${month}-${day}`;
    
    loadSavedSchools();
    
    // 최근 조회한 학교 정보 불러오기
    const recentSchool = getRecentSchool();
    if (recentSchool) {
        document.getElementById('schoolName').value = recentSchool;
        document.getElementById('schoolSelect').value = recentSchool;
        
        // 오늘 날짜의 급식 정보 자동 조회
        const formattedDate = `${year}${month}${day}`;
            
        showLoading();
        try {
            const result = await searchMeal(recentSchool, formattedDate);
            hideLoading();
            updateResult(result, false);
        } catch (error) {
            hideLoading();
            handleError(error);
        }
    }
}

// searchMealHandler 함수 수정
async function searchMealHandler(isNavigation = false) {
    const schoolName = document.getElementById('schoolName').value.trim();
    const mealDate = document.getElementById('mealDate').value.replace(/-/g, '');
    
    if (!schoolName) {
        alert('학교 이름을 입력해주세요.');
        return;
    }

    if (!mealDate) {
        alert('날짜를 선택해주세요.');
        return;
    }

    showLoading();
    try {
        const result = await searchMeal(schoolName, mealDate);
        hideLoading();
        updateResult(result, isNavigation);
        
        // 검색 성공 시 최근 조회 학교 저장
        if (result.success) {
            saveRecentSchool(schoolName);
        }
    } catch (error) {
        hideLoading();
        handleError(error);
    }
    
    if (!isNavigation) {
        document.getElementById('resultContainer').classList.add('hidden');
        document.getElementById('errorContainer').classList.add('hidden');
    }
}

function updateResult(result, isNavigation) {
    if (result.success) {
        document.getElementById('resultSchoolName').textContent = result.schoolName;
        document.getElementById('resultDate').textContent = formatDate(result.date);
        
        const menuContainer = document.getElementById('menuContainer');
        menuContainer.innerHTML = '';
        result.menu.forEach(function(item) {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item rounded-lg text-sm text-gray-700 shadow-sm';
            
            const menuContent = document.createElement('span');
            menuContent.className = 'menu-text flex-grow';
            menuContent.textContent = item;
            menuItem.appendChild(menuContent);
            
            menuContainer.appendChild(menuItem);
        });
        
        document.getElementById('resultCalories').querySelector('span').textContent = result.calories;
        
        if (!isNavigation) {
            document.getElementById('resultContainer').classList.add('hidden');
            setTimeout(() => {
                document.getElementById('resultContainer').classList.remove('hidden');
            }, 10);
        } else {
            document.getElementById('resultContainer').classList.remove('hidden');
        }
    } else {
        handleError(result.error);
    }
}

function handleError(error) {
    document.getElementById('errorMessage').textContent = error;
    document.getElementById('errorContainer').classList.remove('hidden');
}

function formatDate(dateString) {
    return dateString.replace(/(\d{4})(\d{2})(\d{2})/, '$1년 $2월 $3일');
}
