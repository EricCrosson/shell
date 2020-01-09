const Me = imports.misc.extensionUtils.getCurrentExtension();

const { Gdk, Meta, Shell, St } = imports.gi;


/// Activates a window, and moves the mouse point to the center of it.
function activate(win) {
    win.raise();
    win.unminimize();
    win.activate(global.get_current_time());
    place_pointer_on(win)
}

function place_pointer_on(win) {
    let rect = win.get_frame_rect();
    let x = rect.x + 8;
    let y = rect.y + 8;

    let display = Gdk.DisplayManager.get().get_default_display();

    display.get_default_seat()
        .get_pointer()
        .warp(display.get_default_screen(), x, y);
}

var ShellWindow = class ShellWindow {
    constructor(window) {
        this._icon = null;
        this._name = null;
        this._window_tracker = Shell.WindowTracker.get_default();
        this._window_app = null;

        this.meta = window;
    }
    
    activate() {
        activate(this.meta);
    }

    icon(size) {
        let icon = this.window_app().create_icon_texture(size);

        if (!icon) {
            icon = new St.Icon({
                icon_name: 'applications-other',
                icon_type: St.IconType.FULLCOLOR,
                icon_size: size
            });
        }

        return icon;
    }

    is_tilable() {
        if (this.meta.is_skip_taskbar()) {
            return;
        }

        if (blacklisted(this.meta.get_wm_class())) {
            return
        }

        return this.meta['window-type'] == Meta.WindowType.NORMAL;
    }

    move(rect) {
        this.meta.unmaximize(Meta.MaximizeFlags.HORIZONTAL);
        this.meta.unmaximize(Meta.MaximizeFlags.VERTICAL);
        this.meta.unmaximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);

        this.meta.move_resize_frame(
            true,
            rect.x,
            rect.y,
            rect.width,
            rect.height
        );
    }

    name() {
        if (!this._name) {
            try {
                this._name = this.window_app().get_name().replace(/&/g, "&amp;");
            } catch (e) {
                log("window_app_name: " + e);
                this._name = "unknown";
            }
        }

        return this._name;
    }

    swap(other) {
        let ar = this.meta.get_frame_rect();
        let br = other.meta.get_frame_rect();

        this.move(br);
        other.move(ar);
        place_pointer_on(this.meta);
    }

    window_app() {
        if (!this._window_app) {
            this._window_app = this._window_tracker.get_window_app(this.meta)
        }

        return this._window_app;
    }
}

function blacklisted(window_class) {
    return ['Conky'].includes(window_class);
}
