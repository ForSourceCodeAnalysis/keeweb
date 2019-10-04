import { Events } from 'framework/events';
import { View } from 'framework/views/view';
import { KeyHandler } from 'comp/browser/key-handler';
import { Keys } from 'const/keys';
import template from 'templates/dropdown.hbs';

class DropdownView extends View {
    parent = 'body';

    template = template;

    events = {
        'click .dropdown__item': 'itemClick'
    };

    constructor(model) {
        super(model);

        Events.emit('dropdown-shown');
        this.bodyClick = this.bodyClick.bind(this);

        this.listenTo(Events, 'show-context-menu', this.bodyClick);
        this.listenTo(Events, 'dropdown-shown', this.bodyClick);
        $('body').on('click contextmenu keydown', this.bodyClick);

        this.onKey(Keys.DOM_VK_UP, this.upPressed, false, 'dropdown');
        this.onKey(Keys.DOM_VK_DOWN, this.downPressed, false, 'dropdown');
        this.onKey(Keys.DOM_VK_RETURN, this.enterPressed, false, 'dropdown');
        this.onKey(Keys.DOM_VK_ESCAPE, this.escPressed, false, 'dropdown');

        this.prevModal = KeyHandler.modal === 'dropdown' ? undefined : KeyHandler.modal;
        KeyHandler.setModal('dropdown');

        this.once('remove', () => {
            $('body').off('click contextmenu keydown', this.bodyClick);
            if (KeyHandler.modal === 'dropdown') {
                KeyHandler.setModal(this.prevModal);
            }
        });
    }

    render(config) {
        this.options = config.options;
        super.render(config);
        const ownRect = this.$el[0].getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();
        let left = config.position.left || config.position.right - ownRect.right + ownRect.left;
        let top = config.position.top;
        if (left + ownRect.width > bodyRect.right) {
            left = Math.max(0, bodyRect.right - ownRect.width);
        }
        if (top + ownRect.height > bodyRect.bottom) {
            top = Math.max(0, bodyRect.bottom - ownRect.height);
        }
        this.$el.css({ top, left });
    }

    bodyClick(e) {
        if (
            e &&
            [Keys.DOM_VK_UP, Keys.DOM_VK_DOWN, Keys.DOM_VK_RETURN, Keys.DOM_VK_ESCAPE].includes(
                e.which
            )
        ) {
            return;
        }
        if (!this.removed) {
            this.emit('cancel');
        }
    }

    itemClick(e) {
        e.stopPropagation();
        const el = $(e.target).closest('.dropdown__item');
        const selected = el.data('value');
        this.emit('select', { item: selected, el });
    }

    upPressed(e) {
        e.preventDefault();
        if (!this.selectedOption) {
            this.selectedOption = this.options.length - 1;
        } else {
            this.selectedOption--;
        }
        this.renderSelectedOption();
    }

    downPressed(e) {
        e.preventDefault();
        if (this.selectedOption === undefined || this.selectedOption === this.options.length - 1) {
            this.selectedOption = 0;
        } else {
            this.selectedOption++;
        }
        this.renderSelectedOption();
    }

    renderSelectedOption() {
        this.$el.find('.dropdown__item').removeClass('dropdown__item--active');
        this.$el
            .find(`.dropdown__item:nth(${this.selectedOption})`)
            .addClass('dropdown__item--active');
    }

    enterPressed() {
        if (!this.removed && this.selectedOption !== undefined) {
            const el = this.$el.find(`.dropdown__item:nth(${this.selectedOption})`);
            const selected = el.data('value');
            this.emit('select', { item: selected, el });
        }
    }

    escPressed(e) {
        e.stopImmediatePropagation();
        if (!this.removed) {
            this.emit('cancel');
        }
    }
}

export { DropdownView };