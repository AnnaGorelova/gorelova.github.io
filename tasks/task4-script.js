document.addEventListener('DOMContentLoaded', function() {
    const inputString = document.getElementById('inputString');
    const parseBtn = document.getElementById('parseBtn');
    const block1 = document.getElementById('block1');
    const block2 = document.getElementById('block2');
    const block3 = document.getElementById('block3');
    const displayWord = document.getElementById('displayWord');
    
    let wordsData = [];
    let draggedItem = null;
    let originalParent = null;
    let originalPosition = null;
    let offsetX = 0;
    let offsetY = 0;
    
    const valueColors = {};
    function getColorForValue(value) {
        if (!valueColors[value]) {
            valueColors[value] = getRandomColor();
        }
        return valueColors[value];
    }
    
    function parseString(str) {
        const words = str.split('-').map(word => word.trim()).filter(word => word !== '');
        const lowercaseWords = [];
        const uppercaseWords = [];
        const numbers = [];
        
        words.forEach(word => {
            if (/^\d+$/.test(word)) {
                numbers.push(parseInt(word));
            } else if (word[0] === word[0].toLowerCase()) {
                lowercaseWords.push(word);
            } else {
                uppercaseWords.push(word);
            }
        });
        
        lowercaseWords.sort((a, b) => a.localeCompare(b));
        uppercaseWords.sort((a, b) => a.localeCompare(b));
        numbers.sort((a, b) => a - b);
        
        const result = [];
        
        lowercaseWords.forEach((word, index) => {
            result.push({
                key: `a${index + 1}`,
                type: 'lowercase',
                displayText: `${word}`
            });
        });
        
        uppercaseWords.forEach((word, index) => {
            result.push({
                key: `b${index + 1}`,
                type: 'uppercase',
                displayText: `${word}`
            });
        });
        
        numbers.forEach((num, index) => {
            result.push({
                key: `n${index + 1}`,
                type: 'number',
                displayText: `${num}`
            });
        });
        
        return result;
    }
    
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
    
    function createWordElements(words) {
        block2.innerHTML = '';
        
        words.forEach(item => {
            const wordElement = createWordElement(item);
            block2.appendChild(wordElement);
        });
    }
    
    function createWordElement(item) {
        const wordElement = document.createElement('div');
        wordElement.className = 'word-item';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'item-content';
        
        const keySpan = document.createElement('span');
        keySpan.className = 'item-key';
        keySpan.textContent = item.key;
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'item-value';
        valueSpan.textContent = item.displayText;
        
        contentDiv.appendChild(keySpan);
        contentDiv.appendChild(document.createTextNode(' '));
        contentDiv.appendChild(valueSpan);
        
        wordElement.appendChild(contentDiv);
        
        wordElement.draggable = true;
        wordElement.dataset.key = item.key;
        wordElement.dataset.type = item.type;
        wordElement.dataset.displayText = item.displayText;
        
        const color = getRandomColor();
        wordElement.style.backgroundColor = color;
        wordElement.dataset.originalColor = color;
        
        setupDragHandlers(wordElement);
        
        return wordElement;
    }
    
    function createBlock3Element(item, x, y) {
        const wordElement = document.createElement('div');
        wordElement.className = 'word-item block3-item';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'item-content';
        
        const keySpan = document.createElement('span');
        keySpan.className = 'item-key';
        keySpan.textContent = item.dataset.key;
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'item-value';
        valueSpan.textContent = item.dataset.displayText;
        
        contentDiv.appendChild(keySpan);
        contentDiv.appendChild(document.createTextNode(' '));
        contentDiv.appendChild(valueSpan);
        
        wordElement.appendChild(contentDiv);
        
        wordElement.draggable = true;
        wordElement.dataset.key = item.dataset.key;
        wordElement.dataset.type = item.dataset.type;
        wordElement.dataset.displayText = item.dataset.displayText;
        wordElement.dataset.originalColor = item.dataset.originalColor;
        
        wordElement.style.backgroundColor = 'var(--color-secondary)';
        
        wordElement.style.position = 'absolute';
        wordElement.style.left = x + 'px';
        wordElement.style.top = y + 'px';
        
        setupDragHandlers(wordElement);
        
        wordElement.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const displayText = this.dataset.displayText;
            // const color = getColorForValue(displayText);
            const color =  wordElement.dataset.originalColor;
            const wordSpan = document.createElement('span');
            wordSpan.textContent = displayText;
            wordSpan.style.color = color;
            wordSpan.className = 'display-word-span'; 
            
            displayWord.appendChild(wordSpan);
        });
        
        return wordElement;
    }
    
    function setupDragHandlers(element) {
        element.addEventListener('dragstart', handleDragStart);
        element.addEventListener('dragend', handleDragEnd);
        element.addEventListener('drag', handleDrag);
    }
    
    function handleDragStart(e) {
        draggedItem = this;
        originalParent = this.parentElement;
        
        if (originalParent === block3) {
            originalPosition = {
                left: this.style.left,
                top: this.style.top
            };
        }
        
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
        
        const rect = this.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    }
    
    function handleDrag(e) {
        if (draggedItem && originalParent === block3 && e.clientX !== 0 && e.clientY !== 0) {
            const rect = block3.getBoundingClientRect();
            let x = e.clientX - rect.left - offsetX;
            let y = e.clientY - rect.top - offsetY;
            
            const itemRect = draggedItem.getBoundingClientRect();
            x = Math.max(0, Math.min(x, rect.width - itemRect.width));
            y = Math.max(0, Math.min(y, rect.height - itemRect.height));
            
            draggedItem.style.left = x + 'px';
            draggedItem.style.top = y + 'px';
        }
    }
    
    function handleDragEnd(e) {
        this.classList.remove('dragging');
        
        if (originalParent === block3 && this.parentElement === block3) {
        } else if (this.parentElement === originalParent) {
            returnToOriginalPosition(this);
        }
        
        draggedItem = null;
        originalParent = null;
        originalPosition = null;
        offsetX = 0;
        offsetY = 0;
    }
    
    function returnToOriginalPosition(element) {
        if (originalParent === block2) {
            insertElementInSortedPosition(element);
        } else if (originalParent === block3 && originalPosition) {
            element.style.left = originalPosition.left;
            element.style.top = originalPosition.top;
        }
    }
    
    function insertElementInSortedPosition(element) {
        element.style.position = 'static';
        element.style.backgroundColor = element.dataset.originalColor;
        element.classList.remove('block3-item');
        
        const items = Array.from(block2.querySelectorAll('.word-item'));
        const newItemKey = element.dataset.key;
        
        let insertIndex = items.findIndex(item => {
            return compareKeys(newItemKey, item.dataset.key) < 0;
        });
        
        if (insertIndex === -1) {
            block2.appendChild(element);
        } else {
            block2.insertBefore(element, items[insertIndex]);
        }
    }
    
    function compareKeys(keyA, keyB) {
        const typeA = keyA.charAt(0);
        const numA = parseInt(keyA.substring(1));
        const typeB = keyB.charAt(0);
        const numB = parseInt(keyB.substring(1));
        
        const typeOrder = { 'a': 1, 'b': 2, 'n': 3 };
        if (typeOrder[typeA] !== typeOrder[typeB]) {
            return typeOrder[typeA] - typeOrder[typeB];
        }
        
        return numA - numB;
    }
    
    block2.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    
    block2.addEventListener('drop', function(e) {
        e.preventDefault();
        
        if (draggedItem && draggedItem.parentElement === block3) {
            insertElementInSortedPosition(draggedItem);
        }
    });
    
    block3.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    
    block3.addEventListener('drop', function(e) {
        e.preventDefault();
        
        if (draggedItem) {
            const rect = block3.getBoundingClientRect();
            let x = e.clientX - rect.left - offsetX;
            let y = e.clientY - rect.top - offsetY;
            
            const itemRect = draggedItem.getBoundingClientRect();
            x = Math.max(0, Math.min(x, rect.width - itemRect.width));
            y = Math.max(0, Math.min(y, rect.height - itemRect.height));
            
            if (draggedItem.parentElement === block2) {
                const newElement = createBlock3Element(draggedItem, x, y);
                block3.appendChild(newElement);
                draggedItem.remove();
            } else if (draggedItem.parentElement === block3) {
                draggedItem.style.left = x + 'px';
                draggedItem.style.top = y + 'px';
            }
        }
    });
    
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    
    document.addEventListener('drop', function(e) {
        e.preventDefault();
        
        if (draggedItem && 
            e.target !== block2 && 
            e.target !== block3 && 
            !block2.contains(e.target) && 
            !block3.contains(e.target)) {
            returnToOriginalPosition(draggedItem);
        }
    });
    
    parseBtn.addEventListener('click', function() {
        const inputValue = inputString.value;
        
        if (inputValue.trim() === '') {
            alert('Пожалуйста, введите строку для разбора');
            return;
        }
        
        Object.keys(valueColors).forEach(key => delete valueColors[key]);
        
        wordsData = parseString(inputValue);
        
        createWordElements(wordsData);
        
        displayWord.innerHTML = '';
        block3.innerHTML = '';
        
    });
});