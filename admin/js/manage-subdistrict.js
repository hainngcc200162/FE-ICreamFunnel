let currentPage = 1;
let pageSize = 10;

document.addEventListener("DOMContentLoaded", async function () {
    loadProvinces();
    searchSubdistrict();

    document.getElementById("province-select").addEventListener("change", function () {
        currentPage = 1;
        searchSubdistrict(currentPage, pageSize);
    });

    const modalAddBtn = document.getElementById("addSubdistrictButton");
    modalAddBtn.addEventListener("click", async function () {
        const addSubdistrictModal = new bootstrap.Modal(document.getElementById("addSubdistrictModal"));
        await loadProvincesToModal();
        addSubdistrictModal.show();
    });

    document.getElementById('addSubdistrictBtn').addEventListener('click', handleAddSubdistrict);


    addPaginationClickEvents();
});

document.querySelector("form").addEventListener("submit", function (event) {
    event.preventDefault();
    currentPage = 1;
    searchSubdistrict(currentPage, pageSize);
});

async function loadProvinces() {
    const url = `${API_BASE_URL}Provinces?pageNumber=1&pageSize=10000`;
    try {
        const response = await apiRequest(url, { method: 'GET' });
        const data = await response.json();
        const provinces = data.items || [];

        const provinceSelect = document.getElementById('province-select');
        provinceSelect.innerHTML = '<option value="">Tất Cả Tỉnh - Thành</option>';

        provinces.forEach(province => {
            const option = document.createElement('option');
            option.value = province.id;
            option.textContent = province.name;
            provinceSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching provinces:', error);
    }
}

async function searchSubdistrict(pageNumber = 1, pageSize = 10) {
    const provinceId = document.getElementById('province-select').value;
    const subdistrictName = document.getElementById('byName').value.trim();

    let url = `${API_BASE_URL}Subdistricts?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (subdistrictName) url += `&subdistrictName=${encodeURIComponent(subdistrictName)}`;
    if (provinceId) url += `&provinceId=${provinceId}`;

    try {
        const response = await apiRequest(url, { method: 'GET' });
        const data = await response.json();
        const subdistricts = data.items || [];

        const tbody = document.getElementById('subdistrict-results-body');
        tbody.innerHTML = '';

        if (subdistricts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center">Không tìm thấy quận/huyện nào.</td></tr>`;
            return;
        }

        subdistricts.forEach(subdistrict => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${subdistrict.id}</td>
                <td>${subdistrict.name}</td>
                <td>${subdistrict.provinceName || ''}</td>
                <td>
                    <a href="#" class="btn btn-icon text subdistrict-update-btn" data-subdistrict-id="${subdistrict.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </a>
                    <a href="#" class="btn btn-icon text-danger subdistrict-delete-btn" data-subdistrict-id="${subdistrict.id}" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </a>
                </td>
            `;
            tbody.appendChild(row);
        });
        attachUpdateEventListeners();
        attachDeleteEventListeners();

        updatePagination(pageNumber, data.totalPages);
        console.log('Tổng số trang:', data.totalPages);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm quận/huyện:', error);
    }
}

function addPaginationClickEvents() {
    const pageLinks = document.querySelectorAll('.pagination .page-item .page-link');

    pageLinks.forEach(link => {
        link.addEventListener('click', function () {
            const selectedPage = parseInt(this.textContent);
            if (!isNaN(selectedPage)) {
                currentPage = selectedPage;
                searchSubdistrict(currentPage, pageSize);
            }
        });
    });
}

// function updatePagination(currentPage, totalPages) {
//     const paginationContainer = document.querySelector('#subdistrict-pagination .pagination');

//     const firstPageButton = paginationContainer.querySelector('.first');
//     const prevPageButton = paginationContainer.querySelector('.prev');
//     const nextPageButton = paginationContainer.querySelector('.next');
//     const lastPageButton = paginationContainer.querySelector('.last');

//     firstPageButton.classList.toggle('disabled', currentPage === 1);
//     firstPageButton.querySelector('a').addEventListener('click', () => {
//         if (currentPage > 1) {
//             currentPage = 1;
//             searchSubdistrict(currentPage, pageSize);
//         }
//     });

//     prevPageButton.classList.toggle('disabled', currentPage === 1);
//     prevPageButton.querySelector('a').addEventListener('click', () => {
//         if (currentPage > 1) {
//             currentPage--;
//             searchSubdistrict(currentPage, pageSize);
//         }
//     });

//     nextPageButton.classList.toggle('disabled', currentPage === totalPages);
//     nextPageButton.querySelector('a').addEventListener('click', () => {
//         if (currentPage < totalPages) {
//             currentPage++;
//             searchSubdistrict(currentPage, pageSize);
//         }
//     });

//     lastPageButton.classList.toggle('disabled', currentPage === totalPages);
//     lastPageButton.querySelector('a').addEventListener('click', () => {
//         if (currentPage < totalPages) {
//             currentPage = totalPages;
//             searchSubdistrict(currentPage, pageSize);
//         }
//     });

//     const pageItems = paginationContainer.querySelectorAll('.page-item.page-number');
//     pageItems.forEach(item => item.remove()); 

//     for (let i = 1; i <= totalPages; i++) {
//         const pageItem = document.createElement('li');
//         pageItem.className = `page-item page-number${i === currentPage ? ' active' : ''}`;

//         const pageLink = document.createElement('a');
//         pageLink.className = 'page-link';
//         pageLink.href = 'javascript:void(0);';
//         pageLink.innerText = i;
//         pageLink.addEventListener('click', () => {
//             currentPage = i;
//             searchSubdistrict(currentPage, pageSize);
//         });

//         pageItem.appendChild(pageLink);
//         paginationContainer.insertBefore(pageItem, nextPageButton); 
//     }
// }

function updatePagination(currentPage, totalPages) {
    const paginationContainer = document.querySelector('#subdistrict-pagination .pagination');

    const firstPageButton = paginationContainer.querySelector('.first');
    const prevPageButton = paginationContainer.querySelector('.prev');
    const nextPageButton = paginationContainer.querySelector('.next');
    const lastPageButton = paginationContainer.querySelector('.last');

    firstPageButton.classList.toggle('disabled', currentPage === 1);
    prevPageButton.classList.toggle('disabled', currentPage === 1);
    nextPageButton.classList.toggle('disabled', currentPage === totalPages);
    lastPageButton.classList.toggle('disabled', currentPage === totalPages);

    const pageItems = paginationContainer.querySelectorAll('.page-item.page-number, .page-item.ellipsis');
    pageItems.forEach(item => item.remove());

    firstPageButton.querySelector('a').onclick = () => {
        if (currentPage > 1) searchSubdistrict(1, pageSize);
    };
    prevPageButton.querySelector('a').onclick = () => {
        if (currentPage > 1) searchSubdistrict(currentPage - 1, pageSize);
    };
    nextPageButton.querySelector('a').onclick = () => {
        if (currentPage < totalPages) searchSubdistrict(currentPage + 1, pageSize);
    };
    lastPageButton.querySelector('a').onclick = () => {
        if (currentPage < totalPages) searchSubdistrict(totalPages, pageSize);
    };

    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
        addPageNumber(1);
        if (startPage > 2) addEllipsis();
    }

    for (let i = startPage; i <= endPage; i++) {
        addPageNumber(i);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) addEllipsis();
        addPageNumber(totalPages);
    }

    function addPageNumber(page) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item page-number${page === currentPage ? ' active' : ''}`;

        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = 'javascript:void(0);';
        pageLink.innerText = page;
        pageLink.addEventListener('click', () => {
            searchSubdistrict(page, pageSize);
        });

        pageItem.appendChild(pageLink);
        paginationContainer.insertBefore(pageItem, nextPageButton);
    }

    function addEllipsis() {
        const ellipsisItem = document.createElement('li');
        ellipsisItem.className = 'page-item ellipsis disabled';

        const ellipsisLink = document.createElement('span');
        ellipsisLink.className = 'page-link';
        ellipsisLink.innerText = '...';

        ellipsisItem.appendChild(ellipsisLink);
        paginationContainer.insertBefore(ellipsisItem, nextPageButton);
    }
}

function attachUpdateEventListeners() {
    const updateButtons = document.querySelectorAll(".subdistrict-update-btn");
    updateButtons.forEach(button => {
        button.addEventListener("click", async function (e) {
            e.preventDefault();  
            const subdistrictId = this.getAttribute('data-subdistrict-id');
            await updatesubdistrictDetail(subdistrictId);
        });
    });
}

async function updatesubdistrictDetail(subdistrictId) {
    localStorage.setItem('subdistrictId', subdistrictId);
    window.location.href = 'manage-subdistrict-update.html';
}

async function loadProvincesToModal() {
    const url = `${API_BASE_URL}Provinces?pageNumber=1&pageSize=10000`;
    try {
        const response = await apiRequest(url, { method: 'GET' });
        const data = await response.json();
        const provinces = data.items || [];

        const provinceSelectAdd = document.getElementById('province-select-add');
        provinceSelectAdd.innerHTML = '<option value="">Chọn tỉnh/thành phố</option>';

        provinces.forEach(province => {
            const option = document.createElement('option');
            option.value = province.id;
            option.textContent = province.name;
            provinceSelectAdd.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching provinces for modal:', error);
    }
}

async function handleAddSubdistrict() {
    const name = document.getElementById('subdistrict-name-input').value.trim();
    const provinceId = document.getElementById('province-select-add').value;

    const errorDiv = document.getElementById('error-messages');
    const successDiv = document.getElementById('error-success');
    errorDiv.classList.add('d-none');
    successDiv.classList.add('d-none');

    if (!name || !provinceId) {
        errorDiv.textContent = 'Vui lòng nhập đầy đủ thông tin.';
        errorDiv.classList.remove('d-none');
        return;
    }

    try {
        const response = await apiRequest(`${API_BASE_URL}Subdistricts`, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, provinceId }),
        });

        if (response.ok) {
            successDiv.textContent = 'Thêm mới thành công!';
            successDiv.classList.remove('d-none');
            document.getElementById('subdistrict-name-input').value = '';
            document.getElementById('province-select-add').value = '';
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('addSubdistrictModal'));
                modal.hide();
                searchSubdistrict(currentPage, pageSize);  
            }, 1000);
        } else {
            const errorData = await response.json();
            errorDiv.textContent = errorData.message || 'Có lỗi xảy ra khi thêm.';
            errorDiv.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error adding subdistrict:', error);
        errorDiv.textContent = 'Có lỗi xảy ra.';
        errorDiv.classList.remove('d-none');
    }
}

function attachDeleteEventListeners() {
    const deleteButtons = document.querySelectorAll(".subdistrict-delete-btn");
    deleteButtons.forEach(button => {
        button.addEventListener("click", async function (e) {
            e.preventDefault();  
            const subdistrictId = this.getAttribute('data-subdistrict-id');
            await deleteSubdistrict(subdistrictId);
        });
    });
}

async function deleteSubdistrict(subdistrictId) {
    const delSubdistrictModal = new bootstrap.Modal(document.getElementById("delSubdistrictModal"));
    delSubdistrictModal.show();

    const deleteSubdistrictBtn = document.getElementById('deleteSubdistrictBtn');
    const subdistrictNameInput = document.getElementById('subdistrict-name-del');
    const provinceNameInput = document.getElementById('province-name-del');
    const errorDivDel = document.getElementById('del-error-messages');
    const successDivDel = document.getElementById('del-error-success');

    try {
        const url = `${API_BASE_URL}Subdistricts/${subdistrictId}`;
        const response = await apiRequest(url, {
            method: 'GET',
            headers: { 'Accept': '*/*' }
        });

        if (response.ok) {
            const subdistrictData = await response.json();
            subdistrictNameInput.value = subdistrictData.name ?? '';
            provinceNameInput.value = subdistrictData.provinceName ?? ''; 
        } else {
            throw new Error('Không thể lấy thông tin quận/huyện');
        }
    } catch (error) {
        console.error('Lỗi khi gọi API chi tiết quận/huyện:', error);
        errorDivDel.textContent = 'Lỗi khi tải thông tin quận/huyện.';
        errorDivDel.classList.remove('d-none');
    }

    deleteSubdistrictBtn.addEventListener('click', async function () {
        errorDivDel.classList.add('d-none');
        successDivDel.classList.add('d-none');
        errorDivDel.textContent = '';
        successDivDel.textContent = '';

        const subdistrictName = subdistrictNameInput.value.trim();

        if (!subdistrictName) {
            errorDivDel.textContent = 'Tên quận/huyện không hợp lệ!';
            errorDivDel.classList.remove('d-none');
            return;
        }

        try {
            const deleteUrl = `${API_BASE_URL}Subdistricts/${subdistrictId}`;
            const deleteResponse = await apiRequest(deleteUrl, {
                method: 'DELETE',
                headers: { 'Accept': '*/*' }  
            });

            if (deleteResponse.ok) {
                successDivDel.textContent = 'Xóa quận/huyện thành công!';
                successDivDel.classList.remove('d-none');
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('delSubdistrictModal'));
                    modal.hide();
                    searchSubdistrict(currentPage, pageSize);  
                }, 1000);
            } else {
                const errorText = await deleteResponse.text();
                throw new Error(errorText || 'Xóa thất bại!');
            }
        } catch (error) {
            errorDivDel.textContent = error.message || 'Đã có lỗi xảy ra!';
            errorDivDel.classList.remove('d-none');
        }
    });
}

