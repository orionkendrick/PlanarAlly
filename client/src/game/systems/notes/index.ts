import { registerSystem } from "..";
import type { System } from "..";
import type { ApiNote } from "../../../apiTypes";
import { word2color } from "../../../core/utils";
import { getGlobalId, getLocalId, type LocalId } from "../../id";

import {
    sendAddNoteTag,
    sendNewNote,
    sendNoteAccessAdd,
    sendNoteAccessEdit,
    sendNoteAccessRemove,
    sendNoteAddShape,
    sendNoteSetShowIconOnShape,
    sendNoteSetShowOnHover,
    sendRemoveNote,
    sendRemoveNoteTag,
    sendSetNoteText,
    sendSetNoteTitle,
} from "./emits";
import { noteState } from "./state";
import { closeNoteManager } from "./ui";

const { mutableReactive: $, raw, readonly, mutable } = noteState;

class NoteSystem implements System {
    clear(): void {
        closeNoteManager();
        $.notes.clear();
        $.shapeNotes.clear();
        $.currentNote = undefined;
    }

    async newNote(note: ApiNote, sync: boolean): Promise<void> {
        const tags = await Promise.all(note.tags.map(async (tag) => ({ name: tag, colour: await word2color(tag) })));
        $.notes.set(note.uuid, { ...note, tags });
        for (const shape of note.shapes) {
            const shapeId = getLocalId(shape, false);
            if (shapeId === undefined) continue;
            this.attachShape(note.uuid, shapeId, false);
        }
        if (sync) sendNewNote(note);
    }

    setTitle(noteId: string, title: string, sync: boolean): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;
        note.title = title;
        if (sync) {
            sendSetNoteTitle({
                uuid: noteId,
                value: title,
            });
        }
    }

    setText(noteId: string, text: string, sync: boolean, syncAfterDelay: boolean = false): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;

        // Ensure any existing timeout is cleared,
        // so that we don't override a sync with a stale value
        const timeoutId = readonly.syncTimeouts.get(noteId);
        if (timeoutId !== undefined) {
            window.clearTimeout(timeoutId);
            mutable.syncTimeouts.delete(noteId);
        }

        // If there was a timeout ongoing, flush it immediately
        // otherwise only flush if the text actually changed
        if (sync && (timeoutId !== undefined || note.text !== text)) {
            sendSetNoteText({
                uuid: noteId,
                value: text,
            });
        } else if (syncAfterDelay) {
            mutable.syncTimeouts.set(
                noteId,
                window.setTimeout(() => {
                    mutable.syncTimeouts.delete(noteId);
                    sendSetNoteText({
                        uuid: noteId,
                        value: text,
                    });
                }, 5_000),
            );
        }

        note.text = text;
    }

    attachShape(noteId: string, shape: LocalId, sync: boolean): void {
        const globalId = getGlobalId(shape);
        if (globalId === undefined) {
            console.error("Tried to attach a note to a local-only shape");
            return;
        }

        const note = $.notes.get(noteId);
        if (note === undefined) {
            console.error("Tried to attach a shape to a non-existent note");
            return;
        }
        if (!note.shapes.includes(globalId)) {
            note.shapes.push(globalId);
        }

        if (!raw.shapeNotes.has(shape)) $.shapeNotes.set(shape, []);
        $.shapeNotes.get(shape)?.push(noteId);

        if (sync) {
            sendNoteAddShape({ note_id: noteId, shape_id: globalId });
        }
    }

    async addTag(noteId: string, tag: string, sync: boolean): Promise<void> {
        const note = $.notes.get(noteId);
        if (note === undefined) return;
        note.tags.push({ name: tag, colour: await word2color(tag) });
        if (sync) {
            sendAddNoteTag({
                uuid: noteId,
                value: tag,
            });
        }
    }

    removeTag(noteId: string, tagName: string, sync: boolean): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;
        note.tags = note.tags.filter((tag) => tag.name !== tagName);
        if (sync) {
            sendRemoveNoteTag({
                uuid: noteId,
                value: tagName,
            });
        }
    }

    removeNote(noteId: string, sync: boolean): void {
        const note = raw.notes.get(noteId);
        if (note === undefined) return;
        if (raw.currentNote === noteId) $.currentNote = undefined;
        for (const shape of note.shapes) {
            const shapeId = getLocalId(shape, false);
            if (shapeId === undefined) continue;
            const shapeNotes = $.shapeNotes.get(shapeId);
            if (shapeNotes === undefined) continue;
            $.shapeNotes.set(
                shapeId,
                shapeNotes.filter((n) => n !== noteId),
            );
        }
        $.notes.delete(noteId);
        if (sync) sendRemoveNote(noteId);
    }

    addAccess(noteId: string, userName: string, access: { can_view: boolean; can_edit: boolean }, sync: boolean): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;
        const a = note.access.findIndex((a) => a.name === userName);
        if (a >= 0) {
            throw new Error(`Duplicate NoteAccess entry ${noteId}-${userName}`);
        }
        const newAccess = { name: userName, can_edit: access.can_edit, can_view: access.can_view };
        note.access.push(newAccess);
        if (sync) {
            sendNoteAccessAdd({ ...newAccess, note: noteId });
        }
    }

    setAccess(noteId: string, userName: string, access: { can_view: boolean; can_edit: boolean }, sync: boolean): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;
        const a = note.access.find((a) => a.name === userName);
        if (a === undefined) {
            if (userName === "default") return this.addAccess(noteId, userName, access, sync);
            throw new Error(`Unknown NoteAccess ${noteId}-${userName}`);
        }
        a.can_view = access.can_view;
        a.can_edit = access.can_edit;
        if (sync) {
            sendNoteAccessEdit({ ...a, note: noteId });
        }
    }

    removeAccess(noteId: string, userName: string, sync: boolean): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;
        const a = note.access.findIndex((a) => a.name === userName);
        if (a < 0) {
            throw new Error(`Unknown NoteAccess ${noteId}-${userName}`);
        }
        note.access.splice(a, 1);
        if (sync) {
            sendNoteAccessRemove({ uuid: noteId, value: userName });
        }
    }

    setShowOnHover(noteId: string, showOnHover: boolean, sync: boolean): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;

        note.showOnHover = showOnHover;
        if (sync) {
            sendNoteSetShowOnHover({ uuid: noteId, value: showOnHover });
        }
    }

    setShowIconOnShape(noteId: string, showIconOnShape: boolean, sync: boolean): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;

        note.showIconOnShape = showIconOnShape;

        if (sync) {
            sendNoteSetShowIconOnShape({ uuid: noteId, value: showIconOnShape });
        }
    }
}

export const noteSystem = new NoteSystem();
registerSystem("notes", noteSystem, false, noteState);
