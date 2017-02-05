# -*- encoding: utf-8 -*-
from openerp import models, fields, api, _


class ResUsers(models.Model):
    _inherit = 'res.users'

    emp_int = fields.Boolean(string='Interno')
