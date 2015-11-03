/*!
 * VisualEditor UserInterface CommandHelpDialog class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Dialog for listing all command keyboard shortcuts.
 *
 * @class
 * @extends OO.ui.ProcessDialog
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.CommandHelpDialog = function VeUiCommandHelpDialog( config ) {
	// Parent constructor
	ve.ui.CommandHelpDialog.super.call( this, config );
};

/* Inheritance */

OO.inheritClass( ve.ui.CommandHelpDialog, OO.ui.ProcessDialog );

/* Static Properties */

ve.ui.CommandHelpDialog.static.name = 'commandHelp';

ve.ui.CommandHelpDialog.static.size = 'larger';

ve.ui.CommandHelpDialog.static.title =
	OO.ui.deferMsg( 'visualeditor-dialog-command-help-title' );

ve.ui.CommandHelpDialog.static.actions = [
	{
		label: OO.ui.deferMsg( 'visualeditor-dialog-action-done' ),
		flags: 'safe'
	}
];

ve.ui.CommandHelpDialog.static.commandGroups = {
	textStyle: {
		title: 'visualeditor-shortcuts-text-style',
		promote: [ 'bold', 'italic', 'link' ],
		demote: [ 'clear' ]
	},
	clipboard: {
		title: 'visualeditor-shortcuts-clipboard',
		promote: [],
		demote: []
	},
	formatting: {
		title: 'visualeditor-shortcuts-formatting',
		promote: [ 'paragraph', 'pre', 'blockquote' ],
		demote: []
	},
	history: {
		title: 'visualeditor-shortcuts-history',
		promote: [ 'undo', 'redo' ],
		demote: []
	},
	other: {
		title: 'visualeditor-shortcuts-other',
		promote: [ 'findAndReplace', 'findNext', 'findPrevious' ],
		demote: [ 'commandHelp' ]
	}
};

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.CommandHelpDialog.prototype.getBodyHeight = function () {
	return Math.round( this.contentLayout.$element[ 0 ].scrollHeight );
};

/**
 * @inheritdoc
 */
ve.ui.CommandHelpDialog.prototype.initialize = function () {
	var i, j, jLen, k, kLen, triggerList, commands, shortcut, platform, platformKey,
		$list, $shortcut, commandGroups, sequence;

	// Parent method
	ve.ui.CommandHelpDialog.super.prototype.initialize.call( this );

	platform = ve.getSystemPlatform();
	platformKey = platform === 'mac' ? 'mac' : 'pc';
	commandGroups = ve.ui.CommandHelpDialog.static.commandGroups;

	this.contentLayout = new OO.ui.PanelLayout( {
		scrollable: true,
		padded: true,
		expanded: false
	} );
	this.$container = $( '<div>' ).addClass( 've-ui-commandHelpDialog-container' );

	for ( i in commandGroups ) {
		commands = ve.ui.CommandHelpDialog.static.sortedCommandsFromGroup( i, commandGroups[ i ].promote, commandGroups[ i ].demote );
		$list = $( '<dl>' ).addClass( 've-ui-commandHelpDialog-list' );
		for ( j = 0, jLen = commands.length; j < jLen; j++ ) {
			if ( commands[ j ].trigger ) {
				triggerList = ve.ui.triggerRegistry.lookup( commands[ j ].trigger );
			} else {
				triggerList = [];
				if ( commands[ j ].shortcuts ) {
					for ( k = 0, kLen = commands[ j ].shortcuts.length; k < kLen; k++ ) {
						shortcut = commands[ j ].shortcuts[ k ];
						triggerList.push(
							new ve.ui.Trigger(
								ve.isPlainObject( shortcut ) ? shortcut[ platformKey ] : shortcut,
								true
							)
						);
					}
				}
			}
			$shortcut = $( '<dt>' );
			for ( k = 0, kLen = triggerList.length; k < kLen; k++ ) {
				$shortcut.append( $( '<kbd>' ).append(
					triggerList[ k ].getMessage( true ).map( ve.ui.CommandHelpDialog.static.buildKeyNode )
				).find( 'kbd + kbd' ).before( '+' ).end() );
			}
			if ( commands[ j ].sequence ) {
				for ( k = 0, kLen = commands[ j ].sequence.length; k < kLen; k++ ) {
					sequence = ve.ui.sequenceRegistry.lookup( commands[ j ].sequence[ k ] );
					if ( sequence ) {
						$shortcut.append( $( '<kbd class="ve-ui-commandHelpDialog-sequence">' )
							.attr( 'data-label', ve.msg( 'visualeditor-shortcuts-sequence-notice' ) )
							.append(
								sequence.getMessage( true ).map( ve.ui.CommandHelpDialog.static.buildKeyNode )
							)
						);
					}
				}
			}
			$list.append(
				$shortcut,
				$( '<dd>' ).text( ve.msg( commands[ j ].msg ) )
			);
		}
		this.$container.append(
			$( '<div>' )
				.addClass( 've-ui-commandHelpDialog-section' )
				.append(
					$( '<h3>' ).text( ve.msg( commandGroups[ i ].title ) ),
					$list
				)
		);
	}

	this.contentLayout.$element.append( this.$container );
	this.$body.append( this.contentLayout.$element );
};

/* Static methods */

/**
 * Wrap a key (as provided by a Trigger) in a node, for display
 *
 * @static
 * @return {jQuery} A kbd wrapping the key text
 */
ve.ui.CommandHelpDialog.static.buildKeyNode = function ( key ) {
	if ( key === ' ' ) {
		// Might need to expand this if other keys show up, but currently things like
		// the tab-character only come from Triggers and are pre-localized there into
		// "tab" anyway.
		key = 'space';
	}
	return $( '<kbd>' ).attr( 'data-key', key ).text( key );
};

/**
 * Extract a properly sorted list of commands from a command-group
 *
 * @static
 * @param {string} groupName The dialog-category in which to display this
 * @param {string[]} promote Commands which should be displayed first
 * @param {string[]} demote Commands which should be displayed last
 * @return {Object[]} List of commands in order
 */
ve.ui.CommandHelpDialog.static.sortedCommandsFromGroup = function ( groupName, promote, demote ) {
	var i,
		commands = ve.ui.commandHelpRegistry.lookupByGroup( groupName ),
		keys = Object.keys( commands ),
		used = {},
		auto = [],
		promoted = [],
		demoted = [];
	keys.sort();
	for ( i = 0; i < promote.length; i++ ) {
		promoted.push( commands[ promote[ i ] ] );
		used[ promote[ i ] ] = true;
	}
	for ( i = 0; i < demote.length; i++ ) {
		if ( used[ demote[ i ] ] ) {
			continue;
		}
		demoted.push( commands[ demote[ i ] ] );
		used[ demote[ i ] ] = true;
	}
	for ( i = 0; i < keys.length; i++ ) {
		if ( used[ keys[ i ] ] ) {
			continue;
		}
		auto.push( commands[ keys[ i ] ] );
	}
	return promoted.concat( auto, demoted );
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.CommandHelpDialog );
