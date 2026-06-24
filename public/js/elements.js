// elements.js
// Handles the special elemental abilities

const Elements = {
    FIRE: 'fire',
    WATER: 'water',
    NONE: 'none'
};

class ElementSystem {
    constructor(game) {
        this.game = game; // Reference to main game object
        this.playerStates = {
            w: { element: Elements.NONE, used: false, selectedPiece: null },
            b: { element: Elements.NONE, used: false, selectedPiece: null }
        };
        this.activeEffects = {
            frozenPieces: [] // Array of { square: 'e4', turnsRemaining: 1, color: 'b' }
        };
    }

    setElement(color, element) {
        if (this.playerStates[color]) {
            this.playerStates[color].element = element;
        }
    }

    canUseElement(color) {
        const state = this.playerStates[color];
        return state.element !== Elements.NONE && !state.used;
    }

    useElement(color, sourceSquare, targetSquare = null) {
        if (!this.canUseElement(color)) return false;

        const state = this.playerStates[color];
        const element = state.element;

        let success = false;

        if (element === Elements.FIRE) {
            success = this._applyFire(color, sourceSquare);
        } else if (element === Elements.WATER) {
            success = this._applyWater(color, sourceSquare); // freeze target
        }

        if (success) {
            state.used = true;
            this.game.updateUI();
        }

        return success;
    }

    _applyFire(color, square) {
        // Fire: Turn a pawn into a Fire Imp.
        const piece = this.game.chess.get(square);
        if (!piece || piece.color !== color || piece.type !== 'p') {
            console.log("Fire must be used on one of your pawns.");
            return false;
        }

        // We mark this square/piece as a fire imp. Since pieces move, we need to track it.
        // For simplicity, we attach a custom property or track by square if it doesn't move,
        // but piece moves. Let's track the piece by replacing it conceptually or adding to a list.
        // chess.js doesn't support custom piece types easily.
        // We will store the fact that this specific piece is a fire imp.
        piece.isFireImp = true;
        this.game.fireImps = this.game.fireImps || [];
        // Unique ID could be needed, but we can track by square and update on move.
        // Let's add it to a tracking array: { currentSquare: square, color: color }
        this.game.fireImps.push({ square: square, color: color });
        
        console.log(`Fire Imp created at ${square}!`);
        return true;
    }

    _applyWater(color, square) {
        // Water: Freeze an opponent's piece for 1 turn.
        const piece = this.game.chess.get(square);
        if (!piece || piece.color === color) {
            console.log("Water must be used on an opponent's piece.");
            return false;
        }

        // Freeze it
        this.activeEffects.frozenPieces.push({
            square: square,
            turnsRemaining: 2, // 1 full turn (opponent's turn + your next turn)
            color: piece.color
        });

        console.log(`Piece at ${square} is frozen!`);
        return true;
    }

    onTurnStart(color) {
        // Decrement frozen turns
        this.activeEffects.frozenPieces.forEach(effect => {
            if (this.game.chess.turn() === effect.color) {
                // If it's the frozen piece's owner's turn, it uses up one turn of freeze
                effect.turnsRemaining--;
            }
        });

        // Remove expired freezes
        this.activeEffects.frozenPieces = this.activeEffects.frozenPieces.filter(e => e.turnsRemaining > 0);
    }

    isSquareFrozen(square) {
        return this.activeEffects.frozenPieces.some(e => e.square === square);
    }
    
    updateFireImpPosition(oldSquare, newSquare) {
        if (this.game.fireImps) {
            let imp = this.game.fireImps.find(i => i.square === oldSquare);
            if (imp) {
                imp.square = newSquare;
            }
        }
    }

    checkFireImpCapture(targetSquare) {
        if (!this.game.fireImps) return false;
        
        const impIndex = this.game.fireImps.findIndex(i => i.square === targetSquare);
        if (impIndex !== -1) {
            // A fire imp was captured!
            this.triggerExplosion(targetSquare);
            this.game.fireImps.splice(impIndex, 1);
            return true;
        }
        return false;
    }

    triggerExplosion(centerSquare) {
        console.log(`Explosion at ${centerSquare}!`);
        
        // Find adjacent squares
        const files = 'abcdefgh';
        const ranks = '12345678';
        
        const fIdx = files.indexOf(centerSquare[0]);
        const rIdx = ranks.indexOf(centerSquare[1]);
        
        const squaresToRemove = [centerSquare];
        
        for (let df = -1; df <= 1; df++) {
            for (let dr = -1; dr <= 1; dr++) {
                if (df === 0 && dr === 0) continue;
                
                const nfIdx = fIdx + df;
                const nrIdx = rIdx + dr;
                
                if (nfIdx >= 0 && nfIdx < 8 && nrIdx >= 0 && nrIdx < 8) {
                    squaresToRemove.push(files[nfIdx] + ranks[nrIdx]);
                }
            }
        }
        
        // Remove pieces on these squares using chess.remove()
        squaresToRemove.forEach(sq => {
            const piece = this.game.chess.get(sq);
            if (piece) {
                this.game.chess.remove(sq);
                this.game.playExplosionAnimation(sq);
            }
        });
    }
}

// Export if using modules, but we are using script tags
window.ElementSystem = ElementSystem;
window.Elements = Elements;
