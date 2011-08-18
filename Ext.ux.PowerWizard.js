/**
@author		M D McNamara

@release	0.1

@license 	Ext.ux.PowerWizard is licensed under the terms of
			the Open Source LGPL 3.0 license.  Commercial use is permitted to the extent
			that the code/component(s) do NOT become part of another Open Source or Commercially
			licensed development library or toolkit without explicit permission.

			License details: http://www.gnu.org/licenses/lgpl.html

@usage		new Ext.ux.PowerWizard({<config object>})

@config params		"id"				string

					"title"				string
					
					"activeItem"		string or id (usually zero)
					
					"cancelHandler"		function (this)
					
					"submitHandler"		function (this)
					
					"items"				components
 
					By default, items are of xtype "form", with the understanding
					that a fieldset will be the main object within.  Fields within those 
					fieldsets are of xtype "radio".
						
					Within each item, there is support for custom card handling in the form
					of a "sequenceControl" parameter:
						
						sequenceControl: [{
							key: "opt04",
							values: {
								"No": 6,
								"Yes": 6
							}
						}]
		
					During card navigation, this param will be checked against the fields on
					the current page, and depending upon the values specified, the appropriate
					card will be navigated to.
					
					If "sequenceControl" is omitted, the navigation simply moves to the next card.
 					
@properties			"source"				A direct link to the component for use in layouts or windows.

@methods			"getValues()"			Gets all values of all fields on the form that have been rendered.

					"reset(<true|false>)"	Resets wizard back to original state.  If passed "true," then
											all fields on all pages will be reset as well, otherwise their state
											is maintained
 					
 					
@example
 				
	var testWizard = new Ext.ux.PowerWizard({
 		id: "card-emp-wizard",
		title: "",
		activeItem: 0,
		
		cancelHandler: function () {
			// commands to perform upon use cancellation
		},
		submitHandler: function () {
			Ext.Ajax.request({
				url: "<example url>",
				params: this.getValues(),
				callback: function(options, success, response) {
					if (success)
					{
						Ext.Msg.alert("Submission Complete", "Thank you.");
					}
				}
			});
		},
		items: [{
			xtype: "panel",
			id: "card-0",
			html: '<div style="font-size: 9pt;">'
				+ "Welcome to the Sample Wizard Application."
				+ "</div>"
		},{
			id: "card-1",
			sequenceControl: [{
				key: "opt01",
				values: {
					"Yes": 3
				}
			}],
			items: {
				id: "card-1-fieldset-1",
				title: "Are you available to work without restriction?",
				items: [{
					boxLabel: "Yes",
					inputValue: "Yes",
					name: "opt01"
				},{
	            	boxLabel: "No",
	            	inputValue: "No",
	            	name: "opt01"
				}]
			}
		},{				
			id: "card-2",
			items: {
				id: "card-2-fieldset-1",
				title: "Are you available to work from home?",
				items: [{
					boxLabel: "Yes",
					inputValue: "Yes",
					name: "opt02"
				},{
                	boxLabel: "No",
                	inputValue: "No",
                	name: "opt02"
				}]
			}
		},{
			xtype: "panel",
			id: "card-3",
			html: '<div style="font-size: 9pt;">'
				+ "Your information is now complete.  Submit your form whenever ready."
				+ '</div',
			listeners: {
				"show": function () {
					Ext.Msg.alert("Alert", "Your form can now be submitted.");
				}
			}
		}]
	});
 */
Ext.namespace("Ext.ux");

Ext.ux.PowerWizard = function (CFG) {
	
	// Create reference object for this instance
	var thisObj = this;
	
	// Create main private variable object
	var VARS = {};
	
	VARS.data = {
		wizard: null,
		sequence: {
			current: null,
			next: null,
			stack: []
		},
		
		buttons: {
			next: new Ext.Toolbar.Button({
				text: "Next",
				handler: function () {
					_METH_setActiveCard("next");
				}
			}),
			prev: new Ext.Toolbar.Button({
				disabled: true,
				text: "Prev",
				handler: function () {
					_METH_setActiveCard("prev");
				}
			}),
			submit: new Ext.Toolbar.Button({
				disabled: true,
				hidden: (CFG.submitHandler ? false : true),
				text: "Submit",
				handler: (CFG.submitHandler ?
					CFG.submitHandler.createDelegate(thisObj) :
					Ext.emptyFn
				)
			}),
			cancel: new Ext.Toolbar.Button({
				hidden: (CFG.cancelHandler ? false : true),
				text: "Cancel",
				handler: (CFG.cancelHandler ?
					CFG.cancelHandler.createDelegate(thisObj) :
					Ext.emptyFn
				)
			}) 
		},
		bgImage: "wizard-bg-keyboard-large.jpg"
	};
	
	var mainWizardConfigObject = {
			
		bodyStyle: "padding: 15px; "
			+ "background: url(" + VARS.data.bgImage + ") no-repeat center right",
		layout: "card",
		layoutConfig: {
			// Renders each panel upon visiting -- BEWARE: un-rendered panels cannot use any of their
			// xtype-specific methods and properties
			deferredRender: true
		},
		
		// Cascading default settings
		defaults: { // applied to each contained form
			autoHeight: true,
			bodyStyle: "background-color: transparent;",
			defaults: { // Applied to each fieldset within the form
				autoHeight: true,
				defaultType: "radio",
				defaults: { // applied to everything within that fieldset
					labelSeparator: ""
				},
				xtype: "fieldset"
			},
			border: false,
			labelWidth: 1,
			xtype: "form"
		},
		
		
		// Toolbar buttons for this wizard
		tbar: [
			VARS.data.buttons.cancel,
			VARS.data.buttons.prev,
			"->",
			VARS.data.buttons.next,
			VARS.data.buttons.submit
		]
		
	};

	// Apply passed config params to main config object
	Ext.applyIf(mainWizardConfigObject, CFG);

	// Create wizard with main config object
	VARS.data.wizard = new Ext.Panel(mainWizardConfigObject);
	
	// Create public property source
	this.source = VARS.data.wizard;
	this.buttons = VARS.data.buttons;
	
	// Force a layout refresh so that contained formpanels show
	VARS.data.wizard.doLayout();
	
	
	
	//***********************************************
	//
	// Private Methods/Functions/Handlers
	//
	//***********************************************
	var _FUNC_getActiveCardObj = function () {
		return VARS.data.wizard.layout.activeItem;
	};
	
	var _FUNC_getCurrentIndex = function () {
		return parseInt(
			_FUNC_getActiveCardObj().id.substr(
				_FUNC_getActiveCardObj().id.indexOf("-") + 1
			)
		, 10);
	};
	
	var _FUNC_getActiveFormValues = function () {
		return _FUNC_getActiveCardObj().getForm().getValues();
	};
	
	var _FUNC_getSequenceControl = function(panel){
		var ext_formValues = _FUNC_getActiveFormValues(), 
			nextCard = null, 
			returnValue = null;
		
		if (panel.sequenceControl)
		{
			Ext.each(panel.sequenceControl, function(field){
				// if this sequence field's key is present in this panel's values,
				// check to see if its value has a corresponding sequence number, and log it
				// (will iterate through all sequence fields, grabbing the last one)
				nextCard = field.values[ext_formValues[field.key]];
				if (nextCard) {
					returnValue = nextCard;
				}
			}, this);
		}
		
		return returnValue;
	}; 
	
	var _METH_setActiveCard = function (choice) {
	
		// Create shortened variable to check if this panel is a form
		var currentPanel = _FUNC_getActiveCardObj();
		var isForm = currentPanel.isXType("form", true);
		
		// Create shortened form of sequence obj
		var seqCon = VARS.data.sequence;
	
		// Get the index of this, the current page
		seqCon.current = _FUNC_getCurrentIndex();
		seqCon.next = null;
		
		if (choice == "next")
		{
			if (isForm)
			{
				// Check FormPanel validity
				if (!currentPanel.isAllValid())
				{
					Ext.Msg.alert("Error", "Please answer all questions on the form correctly before continuing.");
					return false;
				}
				
				// Get this form's sequence control if it exists
				seqCon.next = _FUNC_getSequenceControl(currentPanel);
			}
			
			// If the next sequence has not been set by a field sequenceControl
			if (!seqCon.next)
			{
				seqCon.next = seqCon.current + 1;
			}
			
			// Since we're going to the "next" card, push this card's index into the stack
			seqCon.stack.push(seqCon.current);
		}
		else if (choice == "prev")
		{
			// Reset when going "backwards" so that this panel's values don't need to be
			// dealt with while compiling values during submission
			if (isForm)
			{
				currentPanel.getForm().reset();
			}
			
			seqCon.next = seqCon.stack.pop();
		}
	
		//
		// Set active panel, and then force a layout refresh so that 
		// any contained formpanels show up
		//
		VARS.data.wizard.layout.setActiveItem(seqCon.next);
		VARS.data.wizard.doLayout();
		
		//
		// Handle bottom bar button disabling/enabling
		//
		if (seqCon.next == "0") 
		{ 
			VARS.data.buttons.prev.disable(); 
		}
		else if (seqCon.next == (VARS.data.wizard.items.length - 1)) 
		{
			// if this is the last card in the card layout
			VARS.data.buttons.next.disable();
			VARS.data.buttons.submit.enable();
		}
		else
		{
			VARS.data.buttons.prev.enable();
			VARS.data.buttons.next.enable();
			VARS.data.buttons.submit.disable();
		}
	};

	this.setActiveCard = _METH_setActiveCard;

};

Ext.ux.PowerWizard.prototype.reset = function (resetAllCards) {
	if (resetAllCards)
	{
		Ext.each(this.source.findByType("form"), function (item) {
			if (item.rendered) 
			{
				item.getForm().reset();
			}
		}, this);
	}
	
	this.buttons.prev.disable();
	this.buttons.next.enable();
	this.buttons.submit.disable();
	this.source.layout.setActiveItem(this.source.initialConfig.activeItem);
};

Ext.ux.PowerWizard.prototype.getValues = function () {
	var outputObj = {};
	
	// Exit if called before object has been set
	if (!this.source) 
	{
		return null;
	}
	
	this.source.items.each(function(item, index, maxLength) {
		if (item.rendered && item.isXType("form", true))
		{
			Ext.apply(outputObj, item.getForm().getValues());
		}
	});
		
	return outputObj;
};

//
// Adds ability to check to see if _all_ fields on a form panel are valid (including radio buttons)
//
Ext.override(Ext.form.FormPanel, {
	isAllValid: function () {
		var extAllRadioObj = this.findByType("radio");
		var theFormValues = this.getForm().getValues();
		var isValid = true;
		
		// Loop through radio objects on this form panel, 
		// checking to see if a value exists in form.getValues()
		// for each non-disabled radio object
		Ext.each(extAllRadioObj, function (item) {
			if (!item.disabled)
			{
				if (theFormValues[item.name] === undefined)
				{
					isValid = false;
				}
			}
		}, this);
		
		// If all radio values check out, then check the actual form's validity status 
		// and return it, otherwise just return false (not all radio buttons are checked)
		return (
			isValid ? 
				this.getForm().isValid() : 
				isValid
		);
	}
});