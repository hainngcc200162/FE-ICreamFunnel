const successMessagesDiv = document.getElementById('scuccess-messages');
const errorMessagesDiv = document.getElementById('error-messages');

window.addEventListener('DOMContentLoaded', async function () {
    const productId = localStorage.getItem('productId');
    const productName = localStorage.getItem('productName');
    const stockQuantity = localStorage.getItem('stockQuantity');


    const productIdInput = document.getElementById('productId');
    if (productIdInput) {
        productIdInput.value = productId ?? '';
    }

    const productNameInput = document.getElementById('productName');
    if (productNameInput) {
        productNameInput.value = productName ?? '';
    }

    const stockQuantityInput = document.getElementById('stockQuantityCurrent');
    if (stockQuantityInput) {
        stockQuantityInput.value = stockQuantity ?? '';
    }

    getProfileData();

    const addStockBtn = document.getElementById('addStockBtn');
    addStockBtn.addEventListener('click', async function () {
        const productIdReq = document.getElementById('productId').value.trim();
        const storeIdReq = document.getElementById('storeId').value.trim();

        const stockQuantityReq = document.getElementById('stockQuantity').value.trim();
        const noteReq = document.getElementById('note').value.trim();
        

        const errorDiv = document.getElementById('error-messages');
        const successDiv = document.getElementById('error-success');

        errorDiv.classList.add('d-none');
        successDiv.classList.add('d-none');
        errorDiv.textContent = '';
        successDiv.textContent = '';

        if (!productIdReq || !storeIdReq || !stockQuantityReq || stockQuantityReq < 0) {
            showErrorMessage(errorDiv, 'Vui lòng điền số lượng muốn nhập kho!');
            return;
        }

        await addStock(productIdReq,storeIdReq,stockQuantityReq,noteReq, errorDiv, successDiv);

    });

});


function showErrorMessage(errorDiv, message) {
    errorDiv.textContent = message;
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.classList.add('btn-close');
    closeButton.setAttribute('aria-label', 'Close');

    closeButton.addEventListener('click', function () {
        errorDiv.classList.add('d-none');
    });

    errorDiv.appendChild(closeButton);
    errorDiv.classList.remove('d-none');
}

function showSuccessMessage(successDiv, message) {
    successDiv.textContent = message;
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.classList.add('btn-close');
    closeButton.setAttribute('aria-label', 'Close');

    closeButton.addEventListener('click', function () {
        successDiv.classList.add('d-none');
    });

    successDiv.appendChild(closeButton);
    successDiv.classList.remove('d-none');
}

async function getProfileData() {
    const url = `${API_BASE_URL}Auth/Profile`;

    try {
        const response = await apiRequest(url, { method: 'GET' });

        if (response.ok) {
            const data = await response.json();

            const storeIdInput = document.getElementById('storeId');
            if (storeIdInput) {
                storeIdInput.value = data.storeId ?? '';
            }

            const storeNameInput = document.getElementById('storeName');
            if (storeNameInput) {
                storeNameInput.value = data.storeName ?? '';
            }

            return data;
        } else {
            throw new Error('Không thể lấy dữ liệu profile');
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }

}

async function addStock(productIdReq, storeIdReq, stockQuantityReq, noteReq, errorDiv, successDiv) {
    const payload = {
        productID: productIdReq,
        storeStocks: [
            {
                storeID: storeIdReq,
                stockQuantity: stockQuantityReq
            }
        ],
        note: noteReq || ""
    };

    const url = `${API_BASE_URL}Stock`; 

    try {
        const response = await apiRequest(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            if (successDiv) {
                successDiv.classList.remove("d-none");
                successDiv.innerText = "Nhập tồn kho thành công!";
                setTimeout(() => successDiv.classList.add("d-none"), 3000);
            }
        } else {
            const errorText = await response.text();
            if (errorDiv) {
                errorDiv.classList.remove("d-none");
                errorDiv.innerText = "Lỗi khi nhập tồn kho: " + errorText;
            }
        }
    } catch (error) {
        if (errorDiv) {
            errorDiv.classList.remove("d-none");
            errorDiv.innerText = "Lỗi hệ thống: " + error.message;
        }
    }
}


