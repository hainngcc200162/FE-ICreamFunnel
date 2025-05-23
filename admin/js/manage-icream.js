let currentPageIndex = 1;
let pageSizeIndex = 5;

window.addEventListener('DOMContentLoaded', async function () {
    await getProfileData();
    searchProducts();
});

async function searchProducts(pageNumber = 1, pageSize = 5) {
    if (!currentStoreId) {
        console.warn('Chưa có storeId, bỏ qua gọi API sản phẩm.');
        return;
    }

    const url = `${API_BASE_URL}Stock/Product?PageNumber=${pageNumber}&PageSize=${pageSize}&storeId=${currentStoreId}`;

    try {
        const response = await apiRequest(url, {
            method: 'GET',
            headers: { 'Accept': '*/*' }
        });

        if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.items)) {
                updateTable(data.items, pageNumber, data.totalPages || 1);
            } else {
                throw new Error('Dữ liệu trả về không đúng cấu trúc');
            }
        } else {
            throw new Error('Không thể lấy dữ liệu sản phẩm');
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }
}

async function addStockProduct(productId, productName, stockQuantity) {
    localStorage.setItem('productId', productId);
    localStorage.setItem('productName', productName);
    localStorage.setItem('stockQuantity', stockQuantity);

    window.location.href = 'manage-icream-addStock.html';
}

async function updStockProduct(productId, productName, stockQuantity) {
    localStorage.setItem('productId', productId);
    localStorage.setItem('productName', productName);
    localStorage.setItem('stockQuantity', stockQuantity);

    window.location.href = 'manage-icream-updStock.html';
}

function updateTable(products, pageNumber, totalPages) {
    const tableBody = document.querySelector(".table-border-bottom-0");
    tableBody.innerHTML = '';

    if (Array.isArray(products) && products.length > 0) {
        products.forEach(product => {
            const stockQuantity =
                product.storeProducts && product.storeProducts.length > 0
                    ? product.storeProducts[0].stockQuantity
                    : 0;

            const row = document.createElement('tr');

            row.innerHTML = `
                <td><strong>${product.name}</strong></td>
                <td><img src="${product.imageUrl}" style="width: 50px; height: auto;" /></td>
                <td>${product.price} VNĐ</td>
                <td><strong>${stockQuantity}</strong></td>
                <td>
                    <a href="#" class="btn btn-icon product-addstock-btn" data-product-stockQuantity="${stockQuantity}" data-product-id="${product.id}" data-product-name="${product.name}" title="Nhập tồn">
                        <i class='bx bx-message-square-add'></i>
                    </a>
                    <a href="#" class="btn btn-icon product-updstock-btn" data-product-stockQuantity="${stockQuantity}" data-product-id="${product.id}" data-product-name="${product.name}" title="Chỉnh sửa tồn">
                        <i class='bx bx-message-square-edit'></i>
                    </a>
                </td>
            `;

            tableBody.appendChild(row);
        });

        attachAddStockEventListeners();
        attachUpdStockEventListeners();

        updatePaginationProduct(pageNumber, totalPages);
    } else {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `<td colspan="6" class="text-center">Không có dữ liệu</td>`;
        tableBody.appendChild(noDataRow);
    }
}


// function updatePaginationProduct(currentPage, totalPages) {
//     const paginationContainer = document.querySelector('#icream-pagination .pagination');

//     const firstPageButton = paginationContainer.querySelector('.first');
//     const prevPageButton = paginationContainer.querySelector('.prev');
//     const nextPageButton = paginationContainer.querySelector('.next');
//     const lastPageButton = paginationContainer.querySelector('.last');

//     firstPageButton.classList.toggle('disabled', currentPage === 1);
//     prevPageButton.classList.toggle('disabled', currentPage === 1);
//     nextPageButton.classList.toggle('disabled', currentPage === totalPages);
//     lastPageButton.classList.toggle('disabled', currentPage === totalPages);

//     const pageItems = paginationContainer.querySelectorAll('.page-item.page-number');
//     pageItems.forEach(item => item.remove());

//     firstPageButton.querySelector('a').addEventListener('click', () => {
//         if (currentPage > 1) {
//             currentPage = 1;
//             searchProducts(currentPage, pageSizeIndex);
//         }
//     });

//     prevPageButton.querySelector('a').addEventListener('click', () => {
//         if (currentPage > 1) {
//             currentPage--;
//             searchProducts(currentPage, pageSizeIndex);
//         }
//     });

//     nextPageButton.querySelector('a').addEventListener('click', () => {
//         if (currentPage < totalPages) {
//             currentPage++;
//             searchProducts(currentPage, pageSizeIndex);
//         }
//     });

//     lastPageButton.querySelector('a').addEventListener('click', () => {
//         if (currentPage < totalPages) {
//             currentPage = totalPages;
//             searchProducts(currentPage, pageSizeIndex);
//         }
//     });

//     for (let i = 1; i <= totalPages; i++) {
//         const pageItem = document.createElement('li');
//         pageItem.className = `page-item page-number${i === currentPage ? ' active' : ''}`;

//         const pageLink = document.createElement('a');
//         pageLink.className = 'page-link';
//         pageLink.href = 'javascript:void(0);';
//         pageLink.innerText = i;
//         pageLink.addEventListener('click', () => {
//             currentPage = i;
//             searchProducts(currentPage, pageSizeIndex);
//         });

//         pageItem.appendChild(pageLink);
//         paginationContainer.insertBefore(pageItem, nextPageButton);
//     }
// }

function updatePaginationProduct(currentPage, totalPages) {
    const paginationContainer = document.querySelector('#icream-pagination .pagination');

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
        if (currentPage > 1) searchProducts(1, pageSizeIndex);
    };
    prevPageButton.querySelector('a').onclick = () => {
        if (currentPage > 1) searchProducts(currentPage - 1, pageSizeIndex);
    };
    nextPageButton.querySelector('a').onclick = () => {
        if (currentPage < totalPages) searchProducts(currentPage + 1, pageSizeIndex);
    };
    lastPageButton.querySelector('a').onclick = () => {
        if (currentPage < totalPages) searchProducts(totalPages, pageSizeIndex);
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
            searchProducts(page, pageSizeIndex);
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


function attachAddStockEventListeners() {
    const addButtons = document.querySelectorAll(".product-addstock-btn");
    addButtons.forEach(button => {
        button.addEventListener("click", async function (e) {
            e.preventDefault();  
            const productId = this.getAttribute('data-product-id');
            const productName = this.getAttribute('data-product-name');
            const stockQuantity = this.getAttribute('data-product-stockQuantity');

            await addStockProduct(productId, productName, stockQuantity);
        });
    });
}

function attachUpdStockEventListeners() {
    const updateButtons = document.querySelectorAll(".product-updstock-btn");
    updateButtons.forEach(button => {
        button.addEventListener("click", async function (e) {
            e.preventDefault();  
            const productId = this.getAttribute('data-product-id');
            const productName = this.getAttribute('data-product-name');
            const stockQuantity = this.getAttribute('data-product-stockQuantity');

            await updStockProduct(productId, productName, stockQuantity);
        });
    });
}

async function getProfileData() {
    const url = `${API_BASE_URL}Auth/Profile`;
    try {
        const response = await apiRequest(url, { method: 'GET' });

        if (response.ok) {
            const data = await response.json();
            currentStoreId = data.storeId;

            const storeIdInput = document.getElementById('storeId');
            if (storeIdInput) {
                storeIdInput.value = data.storeId ?? '';
            }

            const storeNameInput = document.getElementById('storeName');
            if (storeNameInput && storeNameInput.tagName === 'INPUT') {
                storeNameInput.value = data.storeName ?? '';
            }

            const storeNameHeader = document.getElementById('storeName');
            if (storeNameHeader && storeNameHeader.tagName === 'H5') {
                storeNameHeader.textContent = data.storeName ?? 'Tên cửa hàng không xác định';
            }

            return data;
        } else {
            throw new Error('Không thể lấy dữ liệu profile');
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }
}







